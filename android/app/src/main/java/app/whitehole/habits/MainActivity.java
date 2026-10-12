package app.whitehole.habits;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        if("app.whitehole.CHECKIN".equals(intent.getAction()) && bridge != null) bridge.triggerWindowJSEvent("whitehole:checkin");
    }
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WhiteHoleWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(21,21,21));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(21,21,21));
    }
}
