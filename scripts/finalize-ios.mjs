import fs from 'node:fs';
import assert from 'node:assert/strict';
import xcode from 'xcode';
const file='ios/App/App.xcodeproj/project.pbxproj',p=xcode.project(file);p.parseSync();const o=p.hash.project.objects;
const targets=Object.entries(o.PBXNativeTarget).filter(([,v])=>v&&typeof v==='object');
const app=targets.find(([,v])=>String(v.name).replaceAll('"','')==='App');
const widgets=targets.filter(([,v])=>String(v.name).replaceAll('"','')==='WhiteHoleWidget');assert.ok(app&&widgets.length);
const widget=widgets[0],removed=new Set(widgets.slice(1).map(([id])=>id)),products=new Set(widgets.slice(1).map(([,v])=>v.productReference));
const remove=(section,id)=>{delete o[section]?.[id];delete o[section]?.[id+'_comment'];};
for(const [id,t] of widgets.slice(1)){
 for(const phase of t.buildPhases)for(const section of ['PBXSourcesBuildPhase','PBXResourcesBuildPhase','PBXFrameworksBuildPhase'])remove(section,phase.value);
 const list=o.XCConfigurationList[t.buildConfigurationList];for(const c of list?.buildConfigurations||[])remove('XCBuildConfiguration',c.value);remove('XCConfigurationList',t.buildConfigurationList);remove('PBXNativeTarget',id);remove('PBXFileReference',t.productReference);
}
for(const v of Object.values(o.PBXProject))if(v&&typeof v==='object'&&v.targets)v.targets=v.targets.filter(t=>!removed.has(t.value));
for(const v of Object.values(o.PBXGroup))if(v&&typeof v==='object'&&v.children)v.children=v.children.filter(c=>!products.has(c.value));
const copies=app[1].buildPhases.filter(phase=>o.PBXCopyFilesBuildPhase?.[phase.value]);
for(const phase of copies.slice(1))remove('PBXCopyFilesBuildPhase',phase.value);
app[1].buildPhases=app[1].buildPhases.filter(phase=>!copies.slice(1).some(c=>c.value===phase.value));
assert.equal(copies.length>0,true);const copy=o.PBXCopyFilesBuildPhase[copies[0].value];copy.name='"Embed App Extensions"';copy.dstSubfolderSpec=13;copy.files=copy.files.filter(f=>o.PBXBuildFile[f.value]?.fileRef===widget[1].productReference);
assert.equal(copy.files.length,1);o.PBXBuildFile[copy.files[0].value].settings={ATTRIBUTES:['RemoveHeadersOnCopy']};
const wid=widget[0],aid=app[0];
o.PBXTargetDependency||={};o.PBXContainerItemProxy||={};
if(!app[1].dependencies.some(d=>o.PBXTargetDependency[d.value]?.target===wid)){
 const proxy=p.generateUuid(),dep=p.generateUuid();o.PBXContainerItemProxy[proxy]={isa:'PBXContainerItemProxy',containerPortal:p.hash.project.rootObject,proxyType:1,remoteGlobalIDString:wid,remoteInfo:'WhiteHoleWidget'};o.PBXContainerItemProxy[proxy+'_comment']='PBXContainerItemProxy';o.PBXTargetDependency[dep]={isa:'PBXTargetDependency',target:wid,targetProxy:proxy};o.PBXTargetDependency[dep+'_comment']='PBXTargetDependency';app[1].dependencies.push({value:dep,comment:'PBXTargetDependency'});
}
// Keep the shared-container privacy declaration in the surviving extension.
const ref=Object.entries(o.PBXFileReference).find(([,v])=>v&&typeof v==='object'&&String(v.path).replaceAll('"','')==='WhiteHoleWidget/PrivacyInfo.xcprivacy')?.[0];assert.ok(ref);
const resources=p.pbxResourcesBuildPhaseObj(wid);if(!resources.files.some(f=>o.PBXBuildFile[f.value]?.fileRef===ref)){const id=p.generateUuid();o.PBXBuildFile[id]={isa:'PBXBuildFile',fileRef:ref};o.PBXBuildFile[id+'_comment']='PrivacyInfo.xcprivacy in Resources';resources.files.push({value:id,comment:'PrivacyInfo.xcprivacy in Resources'});}
fs.writeFileSync(file,p.writeSync());
const dir='ios/App/App.xcodeproj/xcshareddata/xcschemes';fs.mkdirSync(dir,{recursive:true});
const buildable=`<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${aid}" BuildableName="App.app" BlueprintName="App" ReferencedContainer="container:App.xcodeproj"/>`;
fs.writeFileSync(dir+'/App.xcscheme',`<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">${buildable}</BuildActionEntry></BuildActionEntries></BuildAction><TestAction buildConfiguration="Debug" shouldUseLaunchSchemeArgsEnv="YES"/><LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">${buildable}</BuildableProductRunnable></LaunchAction><ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">${buildable}</BuildableProductRunnable></ProfileAction><AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>`);
console.log('iOS project: one app, one embedded widget, explicit build dependency, shared App scheme.');
