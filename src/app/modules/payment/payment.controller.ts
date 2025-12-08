import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import catchAsync from "../../../shared/catchAsync";
import { stripe } from "../../../helpers/stripe";
import sendResponse from "../../../shared/sendResponse";
import config from "../../../config";

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhooksSecret = config.webHooksecret!;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhooksSecret);
        console.log("✅ Webhook Verified:", event.type);
    } catch (err: any) {
        console.error("❌ Invalid Signature:", err.message);

        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: `Webhook Error: ${err.message}`,
            data: null,
        });

        return; // IMPORTANT: stop execution
    }

    const result = await PaymentService.handleStripeWebhookEvent(event);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Webhook req send successfully",
        data: result,
    });

    // No return!
});

export const PaymentController = {
    handleStripeWebhookEvent,
};
