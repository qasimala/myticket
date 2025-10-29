import { auth } from "./auth";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

// PeachPayments webhook endpoint
http.route({
  path: "/payment-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse form data from PeachPayments
      const body = await request.text();
      const params = new URLSearchParams(body);
      
      const paymentId = params.get("id");
      const resultCode = params.get("result.code");
      const status = params.get("paymentType");
      
      if (!paymentId || !resultCode) {
        return new Response(
          JSON.stringify({ error: "Missing payment data" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Update payment status via internal mutation
      await ctx.runMutation(internal.payments.updatePaymentStatus, {
        paymentId,
        status: status || "unknown",
        resultCode,
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      console.error("Webhook error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;

