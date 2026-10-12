package app.whitehole.habits;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name="WhiteHoleWidget")
public class WhiteHoleWidgetPlugin extends Plugin {
    @PluginMethod public void update(PluginCall call) {
        String payload=call.getString("payload");
        if(payload==null){call.reject("Missing widget data");return;}
        try {
            new JSONObject(payload);
            getContext().getSharedPreferences("whitehole_widget",0).edit().putString("payload",payload).apply();
            WhiteHoleWidgetProvider.refreshAll(getContext());
            call.resolve();
        } catch(Exception error){call.reject("Could not update widget",error);}
    }
    @PluginMethod public void requestPin(PluginCall call) {
        AppWidgetManager manager=AppWidgetManager.getInstance(getContext());
        boolean supported=Build.VERSION.SDK_INT>=26 && manager.isRequestPinAppWidgetSupported();
        if(supported)manager.requestPinAppWidget(new ComponentName(getContext(),WhiteHoleWidgetProvider.class),null,null);
        JSObject result=new JSObject();result.put("supported",supported);call.resolve(result);
    }
}
