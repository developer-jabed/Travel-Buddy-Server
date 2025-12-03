import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { Prisma } from "@prisma/client";
import { ITravelerFilterRequest } from "./traveller.interface";

const getAllTravelers = async (filters: ITravelerFilterRequest, options: any, currentUserId?: string) => {
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

  // Search term logic
  if (searchTerm && searchTerm.trim() !== '') {
    const search = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ]
    });
  }

  // Always exclude deleted
  andConditions.push({ isDeleted: false });

  // Exclude current user if provided
  if (currentUserId) {
    andConditions.push({ userId: { not: currentUserId } });
  }

  const where: Prisma.TravelerProfileWhereInput = { AND: andConditions };

  // Fetch all matching profiles
  const profiles = await prisma.travelerProfile.findMany({
    where,
    include: { user: true },
  });

  // If current user exists, get their profile for matching
  let currentProfile = null;
  if (currentUserId) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { TravelerProfile: true },
    });
    if (user && user.TravelerProfile) {
      currentProfile = user.TravelerProfile;
    }
  }

  // Compute matching scores
  const recommendations = profiles.map(profile => {
    let score = 0;

    if (currentProfile) {
      // Similar interests (0-40)
      if (profile.interests?.length && currentProfile.interests?.length) {
        const matched = profile.interests.filter(i => currentProfile.interests.includes(i));
        score += (matched.length / currentProfile.interests.length) * 40;
      }

      // Travel style match (0-20)
      if (profile.travelStyle === currentProfile.travelStyle) score += 20;

      // City/Country match (0-20)
      if (profile.city && profile.city === currentProfile.city) score += 10;
      if (profile.country && profile.country === currentProfile.country) score += 10;
    }

    // Safety score (0-20)
    const safetyScore = profile.user.safetyScore ?? 80;
    score += Math.min(safetyScore / 5, 20); // normalize 0-20

    return {
      ...profile,
      score: Math.round(score),
    };
  });

  // Sort by score descending (best match first)
  recommendations.sort((a, b) => b.score - a.score);

  // Paginate manually
  const paginated = recommendations.slice(skip, skip + limit);

  return {
    meta: { page, limit, total: recommendations.length },
    data: paginated,
  };
};

const getTravelerById = async (id: string) => {
  return prisma.travelerProfile.findUnique({
    where: { id },
    include: { user: true }
  });
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

  // Try to get current user's traveler profile
  if (userId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { TravelerProfile: true },
    });

    if (currentUser && currentUser.TravelerProfile) {
      currentProfile = currentUser.TravelerProfile;
    }
  }

  // Get all other traveler profiles
  const otherProfiles = await prisma.travelerProfile.findMany({
    where: {
      ...(userId ? { userId: { not: userId } } : {}),
      isDeleted: false,
    },
    include: { user: true },
  });

  // Map and calculate scores
  const recommendations = otherProfiles.map(profile => {
    let score = 0;

    if (currentProfile) {
      // Similar interests (0-40)
      if (profile.interests?.length && currentProfile.interests?.length) {
        const matched = profile.interests.filter(i => currentProfile.interests.includes(i));
        score += (matched.length / currentProfile.interests.length) * 40;
      }

      // Travel style match (0-20)
      if (profile.travelStyle === currentProfile.travelStyle) score += 20;

      // City/Country match (0-20)
      if (profile.city && profile.city === currentProfile.city) score += 10;
      if (profile.country && profile.country === currentProfile.country) score += 10;
    }

    // Safety score (0-20)
    const safetyScore = profile.user.safetyScore ?? 80;
    score += Math.min(safetyScore / 5, 20);

    return {
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      profilePhoto: profile.profilePhoto,
      city: profile.city,
      country: profile.country,
      travelStyle: profile.travelStyle,
      interests: profile.interests,
      score: Math.round(score),
    };
  });

  // Sort by score descending (best match first)
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
};




export const TravelerService = {
  getAllTravelers,
  getTravelerById,
  softDeleteTraveler,
  getRecommendedTravelers, // ✅ added here
};
