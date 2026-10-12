import UIKit
import Capacitor
import WidgetKit

class WhiteHoleViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WhiteHoleWidgetPlugin())
    }
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
}

@objc(WhiteHoleWidgetPlugin)
public class WhiteHoleWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WhiteHoleWidgetPlugin"
    public let jsName = "WhiteHoleWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPin", returnType: CAPPluginReturnPromise)
    ]
    @objc func update(_ call: CAPPluginCall) {
        guard let payload = call.getString("payload"),
              let data = payload.data(using: .utf8),
              (try? JSONSerialization.jsonObject(with: data)) != nil else {
            call.reject("Invalid widget data"); return
        }
        guard let defaults = UserDefaults(suiteName: "group.app.whitehole.habits") else {
            call.reject("The shared widget container is unavailable"); return
        }
        defaults.set(payload, forKey: "whitehole.payload")
        WidgetCenter.shared.reloadTimelines(ofKind: "WhiteHoleDots")
        call.resolve()
    }
    @objc func requestPin(_ call: CAPPluginCall) { call.resolve(["supported": false]) }
}
