import fs from 'node:fs';
import xcode from 'xcode';
const file='ios/App/App.xcodeproj/project.pbxproj';
const project=xcode.project(file);project.parseSync();
const app=project.getFirstTarget();
const appGroup=Object.entries(project.hash.project.objects.PBXGroup).find(([,v])=>v.path==='App')?.[0];
if(!project.pbxGroupByName('Resources')){const resources=project.addPbxGroup([],'Resources');project.addToPbxGroup(resources.uuid,project.getFirstProject().firstProject.mainGroup);}
if(!project.hasFile('PrivacyInfo.xcprivacy'))project.addResourceFile('PrivacyInfo.xcprivacy',{target:app.uuid},appGroup);
if(!project.hasFile('WhiteHoleViewController.swift')&&!project.hasFile('App/WhiteHoleViewController.swift'))project.addSourceFile('WhiteHoleViewController.swift',{target:app.uuid},appGroup);
for(const ref of Object.values(project.hash.project.objects.PBXFileReference))if(ref&&typeof ref==='object'&&String(ref.name).includes('WhiteHoleViewController.swift'))ref.path='WhiteHoleViewController.swift';
let widget=Object.entries(project.pbxNativeTargetSection()).find(([,v])=>v&&typeof v==='object'&&String(v.name).replaceAll('"','')==='WhiteHoleWidget');
if(!widget){
  const target=project.addTarget('WhiteHoleWidget','app_extension','WhiteHoleWidget','app.whitehole.habits.widget');
  project.addBuildPhase(['WhiteHoleWidget/WhiteHoleWidget.swift'],'PBXSourcesBuildPhase','Sources',target.uuid);
  project.addBuildPhase(['WhiteHoleWidget/DMSans.ttf'],'PBXResourcesBuildPhase','Resources',target.uuid);
  project.addBuildPhase([],'PBXFrameworksBuildPhase','Frameworks',target.uuid);
  widget=[target.uuid,target.pbxNativeTarget];
}
if(!project.hasFile('WhiteHoleWidget/PrivacyInfo.xcprivacy'))project.addResourceFile('WhiteHoleWidget/PrivacyInfo.xcprivacy',{target:widget[0]});
const configs=project.pbxXCBuildConfigurationSection();
for(const [id,c] of Object.entries(configs)){
  if(typeof c!=='object'||!c.buildSettings)continue;
  const b=c.buildSettings;
  if(String(b.PRODUCT_NAME).includes('WhiteHoleWidget')||b.PRODUCT_BUNDLE_IDENTIFIER==='app.whitehole.habits.widget'){
    Object.assign(b,{INFOPLIST_FILE:'WhiteHoleWidget/Info.plist',CODE_SIGN_ENTITLEMENTS:'WhiteHoleWidget/WhiteHoleWidget.entitlements',IPHONEOS_DEPLOYMENT_TARGET:'17.0',SWIFT_VERSION:'5.0',TARGETED_DEVICE_FAMILY:'"1,2"',SKIP_INSTALL:'YES',APPLICATION_EXTENSION_API_ONLY:'YES',MARKETING_VERSION:'1.0',CURRENT_PROJECT_VERSION:'1',CODE_SIGN_STYLE:'Automatic',LD_RUNPATH_SEARCH_PATHS:'"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"'});
  }else if(b.PRODUCT_BUNDLE_IDENTIFIER==='app.whitehole.habits')b.CODE_SIGN_ENTITLEMENTS='App/App.entitlements';
}
for(const section of Object.values(project.hash.project.objects))if(section&&typeof section==='object')for(const value of Object.values(section))if(value&&typeof value==='object')for(const [key,v] of Object.entries(value))if(v===undefined||v==='undefined')delete value[key];
fs.writeFileSync(file,project.writeSync());
const storyboard='ios/App/App/Base.lproj/Main.storyboard';fs.writeFileSync(storyboard,fs.readFileSync(storyboard,'utf8').replace('customClass="CAPBridgeViewController" customModule="Capacitor"','customClass="WhiteHoleViewController" customModule="App"'));
const info='ios/App/App/Info.plist';let text=fs.readFileSync(info,'utf8');
if(!text.includes('CFBundleURLTypes'))text=text.replace('</dict>\n</plist>','<key>CFBundleURLTypes</key><array><dict><key>CFBundleURLSchemes</key><array><string>whitehole</string></array></dict></array>\n</dict>\n</plist>');
fs.writeFileSync(info,text);
console.log('iOS app bridge, shared app group and WidgetKit extension are configured.');
