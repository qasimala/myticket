import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type WalletRequestBody = {
  bookingId?: string;
  qrValue?: string;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  ticketName?: string;
  customerName?: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

const JWT_AUDIENCE = "google";
const JWT_TYPE = "savetowallet";
const SAVE_TO_WALLET_BASE_URL = "https://pay.google.com/gp/v/save/";

const sanitizeIdComponent = (value: string, fallback: string) => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

  return cleaned.length > 0 ? cleaned : fallback.toLowerCase();
};

const parseServiceAccount = (): ServiceAccount => {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("GOOGLE_WALLET_SERVICE_ACCOUNT is not configured");
  }

  let jsonString = raw.trim();
  if (!jsonString.startsWith("{")) {
    try {
      jsonString = Buffer.from(jsonString, "base64").toString("utf8");
    } catch {
      throw new Error(
        "Failed to decode GOOGLE_WALLET_SERVICE_ACCOUNT. Ensure it is valid JSON or base64 encoded JSON."
      );
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(
      "GOOGLE_WALLET_SERVICE_ACCOUNT does not contain valid JSON credentials"
    );
  }

  const maybeAccount = parsed as Partial<ServiceAccount>;
  if (!maybeAccount.client_email || !maybeAccount.private_key) {
    throw new Error(
      "Service account JSON must include client_email and private_key"
    );
  }

  return {
    client_email: maybeAccount.client_email,
    private_key: maybeAccount.private_key,
  };
};

const buildSaveJwt = (
  body: Required<Pick<WalletRequestBody, "bookingId" | "qrValue">> &
    Omit<WalletRequestBody, "bookingId" | "qrValue">,
  serviceAccount: ServiceAccount
) => {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!issuerId) {
    throw new Error("GOOGLE_WALLET_ISSUER_ID is not configured");
  }

  const issuerName =
    process.env.GOOGLE_WALLET_ISSUER_NAME?.trim() || "MyTicket";
  const eventIdentifier =
    body.eventId || body.eventName || body.bookingId || "event";
  const classSuffix = sanitizeIdComponent(eventIdentifier, "event");
  const objectSuffix = sanitizeIdComponent(body.bookingId, body.bookingId);

  const classId = `${issuerId}.${classSuffix}`;
  const objectId = `${issuerId}.${objectSuffix}`;

  const eventTicketClass: Record<string, unknown> = {
    id: classId,
    issuerName,
    reviewStatus: "UNDER_REVIEW",
  };

  if (body.eventName) {
    eventTicketClass.eventName = {
      defaultValue: {
        language: "en-US",
        value: body.eventName,
      },
    };
  }

  if (body.eventLocation) {
    eventTicketClass.venue = {
      name: {
        defaultValue: {
          language: "en-US",
          value: body.eventLocation,
        },
      },
    };
  }

  const ticketObject: Record<string, unknown> = {
    id: objectId,
    classId,
    state: "ACTIVE",
    barcode: {
      type: "QR_CODE",
      value: body.qrValue,
      alternateText: body.bookingId,
    },
    ticketNumber: body.bookingId,
  };

  if (body.ticketName) {
    ticketObject.ticketType = body.ticketName;
  }

  if (body.customerName) {
    ticketObject.ticketHolderName = body.customerName;
  }

  if (body.eventDate) {
    const eventDate = new Date(body.eventDate);
    if (!Number.isNaN(eventDate.getTime())) {
      ticketObject.eventDateTime = {
        start: {
          date: eventDate.toISOString(),
        },
      };
    }
  }

  const textModules = [];
  if (body.eventLocation) {
    textModules.push({
      header: "Location",
      body: body.eventLocation,
    });
  }
  if (textModules.length > 0) {
    ticketObject.textModulesData = textModules;
  }

  const origins: string[] = [];
  const configuredOrigin = process.env.GOOGLE_WALLET_ORIGIN;
  if (configuredOrigin) {
    origins.push(configuredOrigin);
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  const payload: Record<string, unknown> = {
    iss: serviceAccount.client_email,
    aud: JWT_AUDIENCE,
    typ: JWT_TYPE,
    payload: {
      eventTicketObjects: [ticketObject],
      eventTicketClasses: [eventTicketClass],
    },
  };

  if (origins.length > 0) {
    payload.origins = origins;
  }

  return jwt.sign(payload, serviceAccount.private_key, {
    algorithm: "RS256",
  });
};

const handleRequest = async (request: NextRequest) => {
  let body: WalletRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.bookingId) {
    return NextResponse.json(
      { error: "bookingId is required" },
      { status: 400 }
    );
  }

  if (!body.qrValue) {
    return NextResponse.json(
      { error: "qrValue is required" },
      { status: 400 }
    );
  }

  try {
    const serviceAccount = parseServiceAccount();
    const signedJwt = buildSaveJwt(
      {
        bookingId: body.bookingId,
        qrValue: body.qrValue,
        eventId: body.eventId,
        eventName: body.eventName,
        eventDate: body.eventDate,
        eventLocation: body.eventLocation,
        ticketName: body.ticketName,
        customerName: body.customerName,
      },
      serviceAccount
    );

    return NextResponse.json({
      saveUrl: `${SAVE_TO_WALLET_BASE_URL}${signedJwt}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create wallet pass";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Use POST with bookingId and qrValue to generate a Google Wallet link.",
    },
    { status: 405 }
  );
}
