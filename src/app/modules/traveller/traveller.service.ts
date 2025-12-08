import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { Prisma } from "@prisma/client";
import { ITravelerFilterRequest } from "./traveller.interface";

const getAllTravelers = async (
  filters: ITravelerFilterRequest,
  options: any,
  currentUserId?: string
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.TravelerProfileWhereInput[] = [];

  // Exact filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({
        [key]: { equals: (filterData as any)[key] }
      }))
    });
  }

  // Search term
  if (searchTerm && searchTerm.trim() !== "") {
    const search = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  // Exclude deleted
  andConditions.push({ isDeleted: false });

  // Exclude current logged-in user
  if (currentUserId) {
    andConditions.push({ userId: { not: currentUserId } });
  }

  const where: Prisma.TravelerProfileWhereInput = { AND: andConditions };

  // Fetch traveler profiles WITH reviews
  const profiles = await prisma.travelerProfile.findMany({
    where,
    include: {
      user: {
        include: {
          reviewsReceived: true, // ⭐ includes ratings
        },
      },
    },
  });

  // Fetch current user profile for matching logic
  let currentProfile = null;
  if (currentUserId) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { TravelerProfile: true },
    });
    if (user?.TravelerProfile) currentProfile = user.TravelerProfile;
  }

  // 🚀 Compute matching scores + rating data
  const recommendations = profiles.map(profile => {
    let score = 0;

    // Matching logic -------------------------------------------------
    if (currentProfile) {
      // Similar interests (0–40)
      if (profile.interests?.length && currentProfile.interests?.length) {
        const matched = profile.interests.filter(i =>
          currentProfile.interests.includes(i)
        );
        score += (matched.length / currentProfile.interests.length) * 40;
      }

      // Travel style (0–20)
      if (profile.travelStyle === currentProfile.travelStyle) score += 20;

      // City/country (0–20)
      if (profile.city && profile.city === currentProfile.city) score += 10;
      if (profile.country && profile.country === currentProfile.country) score += 10;
    }

    // Safety score (0–20)
    const safetyScore = profile.user.safetyScore ?? 80;
    score += Math.min(safetyScore / 5, 20);

    // ⭐ Calculate rating stats --------------------------------------
    const reviews = profile.user.reviewsReceived || [];
    const totalReviews = reviews.length;

    // Count stars
    const breakdown = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    // Average rating
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

    return {
      ...profile,
      score: Math.round(score),

      // ⭐ Add these to returned data:
      avgRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      totalReviews,
      ratingBreakdown: breakdown,
    };
  });

  // Sort by best match
  recommendations.sort((a, b) => b.score - a.score);

  // Paginate manually
  const paginated = recommendations.slice(skip, skip + limit);

  return {
    meta: { page, limit, total: recommendations.length },
    data: paginated,
  };
};


const getTravelerById = async (id: string) => {
  const traveler = await prisma.travelerProfile.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          reviewsReceived: {
            include: {
              reviewer: true, // reviewer info
            },
          },
          reviewsGiven: true,

          // ✅ Reports where this user is the reporter
          reportsMade: {
            include: {
              reported: true, // optional: the user who was reported
            },
          },

          // ✅ Reports where this user is reported by someone
          reportsReceived: {
            include: {
              reporter: true, // optional: who reported this user
            },
          },
        },
      },
    },
  });

  if (!traveler) {
    return {
      success: false,
      message: "Traveler not found",
      data: null,
    };
  }

  return {
    success: true,
    message: "Traveler profile fetched successfully",
    data: traveler,
  };
};




const softDeleteTraveler = async (id: string) => {
  const traveler = await prisma.travelerProfile.findUniqueOrThrow({ where: { id } });

  // Toggle status
  const newStatus = traveler.isDeleted ? false : true;

  const result = await prisma.$transaction(async tx => {
    await tx.travelerProfile.update({
      where: { id },
      data: { isDeleted: newStatus }
    });

    await tx.user.update({
      where: { id: traveler.userId },
      data: { status: newStatus ? 'INACTIVE' : 'ACTIVE' }
    });

    return { id, isDeleted: newStatus };
  });

  return result;
};

// ----------------- Recommended Travelers -----------------
const getRecommendedTravelers = async (userId?: string) => {
  let currentProfile: any = null;

  // Get current user profile
  if (userId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { TravelerProfile: true },
    });

    currentProfile = currentUser?.TravelerProfile;
  }

  // Get all other traveler profiles
  const otherProfiles = await prisma.travelerProfile.findMany({
    where: {
      ...(userId ? { userId: { not: userId } } : {}),
      isDeleted: false,
    },
    include: { user: true },
  });

  const recommendations = otherProfiles
    .map((profile) => {
      let score = 0;
      const reasons: string[] = [];
      let hasAnyMatch = false; // <-- Only show if TRUE

      if (currentProfile) {
        // Interests match
        if (profile.interests?.length && currentProfile.interests?.length) {
          const matched = profile.interests.filter((i) =>
            currentProfile.interests.includes(i)
          );

          if (matched.length > 0) {
            score += (matched.length / currentProfile.interests.length) * 40;
            reasons.push(`Matched interests: ${matched.join(", ")}`);
            hasAnyMatch = true;
          }
        }

        // Travel style match
        if (profile.travelStyle === currentProfile.travelStyle) {
          score += 20;
          reasons.push(`Same travel style: ${profile.travelStyle}`);
          hasAnyMatch = true;
        }

        // Language match
        if (profile.languages?.length && currentProfile.languages?.length) {
          const matchedLang = profile.languages.filter((i) =>
            currentProfile.languages.includes(i)
          );

          if (matchedLang.length > 0) {
            score += Math.min(matchedLang.length * 5, 15);
            reasons.push(`Speaks same languages: ${matchedLang.join(", ")}`);
            hasAnyMatch = true;
          }
        }

        // City match
        if (profile.city && profile.city === currentProfile.city) {
          score += 10;
          reasons.push(`Same city: ${profile.city}`);
          hasAnyMatch = true;
        }

        // Country match
        if (profile.country && profile.country === currentProfile.country) {
          score += 10;
          reasons.push(`Same country: ${profile.country}`);
          hasAnyMatch = true;
        }
      }

      // Safety score always contributes, but should NOT force match
      const safetyScore = profile.user.safetyScore ?? 80;
      const safe = Math.min(safetyScore / 5, 20);
      score += safe;

      if (safe > 15) {
        reasons.push("High safety score");
        hasAnyMatch = true;
      }

      // ❗ If nothing matched → EXCLUDE completely
      if (!hasAnyMatch) return null;

      return {
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        profilePhoto: profile.profilePhoto,

        city: profile.city,
        country: profile.country,
        travelStyle: profile.travelStyle,
        interests: profile.interests,
        languages: profile.languages,

        matchPercentage: Math.round(score),
        matchReasons: reasons,
      };
    })
    .filter(Boolean); // <--- Remove null values (no matches)

  // Sort by match score
  recommendations.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);

  return recommendations;
};




export const TravelerService = {
  getAllTravelers,
  getTravelerById,
  softDeleteTraveler,
  getRecommendedTravelers, // ✅ added here
};
