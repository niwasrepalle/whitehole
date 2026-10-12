package app.whitehole.habits;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class WhiteHoleWidgetProvider extends AppWidgetProvider {
    @Override public void onUpdate(Context context,AppWidgetManager manager,int[] ids) {for(int id:ids)update(context,manager,id);}
    @Override public void onReceive(Context context,Intent intent) {
        super.onReceive(context,intent);
        String action=intent.getAction();
        if(Intent.ACTION_DATE_CHANGED.equals(action)||Intent.ACTION_TIME_CHANGED.equals(action)||Intent.ACTION_TIMEZONE_CHANGED.equals(action)||Intent.ACTION_BOOT_COMPLETED.equals(action))refreshAll(context);
    }
    public static void refreshAll(Context context) {
        AppWidgetManager manager=AppWidgetManager.getInstance(context);
        for(int id:manager.getAppWidgetIds(new ComponentName(context,WhiteHoleWidgetProvider.class)))update(context,manager,id);
    }
    private static void update(Context context,AppWidgetManager manager,int id) {
        RemoteViews view=new RemoteViews(context.getPackageName(),R.layout.whitehole_widget);
        try {
            JSONObject payload=new JSONObject(context.getSharedPreferences("whitehole_widget",0).getString("payload","{}"));
            Calendar date=Calendar.getInstance();if(date.get(Calendar.HOUR_OF_DAY)<payload.optInt("cutoff",0))date.add(Calendar.DAY_OF_MONTH,-1);
            String key=new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(date.getTime());
            JSONObject days=payload.optJSONObject("days");JSONObject stats=days!=null?days.optJSONObject(key):null;
            String theme=payload.optString("theme","dark");boolean systemDark=(context.getResources().getConfiguration().uiMode&Configuration.UI_MODE_NIGHT_MASK)==Configuration.UI_MODE_NIGHT_YES;
            boolean dark=theme.equals("dark")||(theme.equals("system")&&systemDark);
            view.setInt(R.id.widget_root,"setBackgroundResource",dark?R.drawable.widget_dark:R.drawable.widget_light);
            int fg=dark?Color.rgb(217,217,217):Color.BLACK;
            view.setTextColor(R.id.widget_title,fg);view.setTextColor(R.id.widget_count,fg);view.setTextColor(R.id.widget_streak,fg);
            view.setTextViewText(R.id.widget_count,stats==null?"Open to refresh":stats.optInt("done")+"/"+stats.optInt("scheduled"));
            view.setTextViewText(R.id.widget_streak,"🔥 "+(stats==null?0:stats.optInt("streak")));
            JSONArray dots=stats==null?new JSONArray():stats.optJSONArray("dots");
            int[] dotIds={R.id.dot1,R.id.dot2,R.id.dot3,R.id.dot4,R.id.dot5,R.id.dot6,R.id.dot7,R.id.dot8,R.id.dot9,R.id.dot10,R.id.dot11,R.id.dot12};
            for(int i=0;i<dotIds.length;i++) {
                view.setViewVisibility(dotIds[i],dots!=null&&i<dots.length()?View.VISIBLE:View.GONE);
                view.setTextViewText(dotIds[i],dots!=null&&dots.optBoolean(i)?"●":"○");view.setTextColor(dotIds[i],fg);
            }
        } catch(Exception ignored){view.setTextViewText(R.id.widget_count,"Open WhiteHole");}
        Intent open=new Intent(context,MainActivity.class);open.setAction("app.whitehole.CHECKIN");open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        view.setOnClickPendingIntent(R.id.widget_root,PendingIntent.getActivity(context,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        manager.updateAppWidget(id,view);
    }
}
