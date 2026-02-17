package com.voicecrm.twa;

import android.net.Uri;
import android.os.Bundle;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://voicecrm.replit.app");
    }
}
