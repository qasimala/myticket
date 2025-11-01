package com.myticket.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@CapacitorPlugin(name = "QrToken")
public class QrTokenPlugin extends Plugin {

    private static final long QR_WINDOW_MS = 15_000; // 15 seconds
    private static final String HMAC_SHA256 = "HmacSHA256";
    
    @PluginMethod
    public void generateTokens(PluginCall call) {
        try {
            String bookingId = call.getString("bookingId");
            String ticketId = call.getString("ticketId");
            
            if (bookingId == null || ticketId == null) {
                call.reject("bookingId and ticketId are required");
                return;
            }
            
            // Get the secret key from BuildConfig
            String secret = BuildConfig.QR_SECRET;
            if (secret == null || secret.isEmpty()) {
                call.reject("QR_SECRET not configured in build");
                return;
            }
            
            long currentTimeMs = System.currentTimeMillis();
            long timeSlot = currentTimeMs / QR_WINDOW_MS;
            
            JSONArray tokensArray = new JSONArray();
            
            // Generate current and next token (same as server)
            for (int i = 0; i < 2; i++) {
                long slot = timeSlot + i;
                JSONObject token = generateToken(bookingId, ticketId, slot, secret);
                tokensArray.put(token);
            }
            
            // Convert JSONObject to JSObject for Capacitor
            JSObject result = new JSObject();
            result.put("windowMs", QR_WINDOW_MS);
            
            // Convert JSONArray to ArrayList of JSObjects for Capacitor
            java.util.ArrayList<JSObject> jsTokensList = new java.util.ArrayList<>();
            for (int i = 0; i < tokensArray.length(); i++) {
                JSONObject token = tokensArray.getJSONObject(i);
                JSObject jsToken = new JSObject();
                jsToken.put("qrValue", token.getString("qrValue"));
                jsToken.put("expiresAt", token.getLong("expiresAt"));
                jsTokensList.add(jsToken);
            }
            result.put("tokens", jsTokensList);
            
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to generate QR tokens: " + e.getMessage(), e);
        }
    }
    
    private JSONObject generateToken(String bookingId, String ticketId, long slot, String secret) 
            throws JSONException, NoSuchAlgorithmException, InvalidKeyException {
        
        // Create payload base string (same as server)
        String payloadBase = bookingId + ":" + ticketId + ":" + slot;
        
        // Compute HMAC-SHA256 signature
        String signature = computeHmacSha256(payloadBase, secret);
        
        // Create QR value JSON
        JSONObject qrPayload = new JSONObject();
        qrPayload.put("bookingId", bookingId);
        qrPayload.put("ticketId", ticketId);
        qrPayload.put("ts", slot);
        qrPayload.put("sig", signature);
        
        // Create token object
        JSONObject token = new JSONObject();
        token.put("qrValue", qrPayload.toString());
        token.put("expiresAt", (slot + 1) * QR_WINDOW_MS);
        
        return token;
    }
    
    private String computeHmacSha256(String data, String secret) 
            throws NoSuchAlgorithmException, InvalidKeyException {
        
        Mac mac = Mac.getInstance(HMAC_SHA256);
        SecretKeySpec secretKeySpec = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8), 
            HMAC_SHA256
        );
        mac.init(secretKeySpec);
        
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        // Convert to hex string (same format as server)
        return bytesToHex(hmacBytes);
    }
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}

