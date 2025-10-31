package com.myticket.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the QR Token plugin
        registerPlugin(QrTokenPlugin.class);
    }
}
