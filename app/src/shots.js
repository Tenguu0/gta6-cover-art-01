export async function runShot(query, loadScene) {
  const scene=query.get('shot');if(!scene)return false;
  document.body.classList.add(`shot-${scene}`);
  await loadScene(query.get('photo')||'pier',query.get('caption')||'AFTER HOURS',query.get('layout')||'four',query.get('grade')||'sunset');
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  window.__shotReady=true;
  return true;
}
