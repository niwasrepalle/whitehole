import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import xcode from 'xcode';
test('iOS has one widget, embedded product, explicit dependency and shared scheme',()=>{
 const p=xcode.project('ios/App/App.xcodeproj/project.pbxproj');p.parseSync();const o=p.hash.project.objects;
 const targets=Object.entries(o.PBXNativeTarget).filter(([,t])=>t&&typeof t==='object');assert.equal(targets.length,2);
 const [appId,app]=targets.find(([,t])=>String(t.name).replaceAll('"','')==='App');const [widgetId,widget]=targets.find(([,t])=>String(t.name).replaceAll('"','')==='WhiteHoleWidget');
 assert.ok(app.dependencies.some(d=>o.PBXTargetDependency[d.value]?.target===widgetId));
 const copy=app.buildPhases.map(ph=>o.PBXCopyFilesBuildPhase?.[ph.value]).filter(Boolean);assert.equal(copy.length,1);assert.equal(Number(copy[0].dstSubfolderSpec),13);assert.equal(copy[0].files.length,1);assert.equal(o.PBXBuildFile[copy[0].files[0].value].fileRef,widget.productReference);
 const resources=p.pbxResourcesBuildPhaseObj(widgetId).files.map(f=>String(o.PBXFileReference[o.PBXBuildFile[f.value].fileRef]?.path).replaceAll('"',''));assert.ok(resources.includes('WhiteHoleWidget/DMSans.ttf'));assert.ok(resources.includes('WhiteHoleWidget/PrivacyInfo.xcprivacy'));
 const scene=fs.readFileSync('ios/App/App/SceneDelegate.swift','utf8');assert.ok(scene.includes('rootViewController = WhiteHoleViewController()'));
 const scheme=fs.readFileSync('ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme','utf8');assert.ok(scheme.includes(appId));assert.ok(scheme.includes('buildImplicitDependencies="YES"'));
});
