export function audioPanel(audio) {
  return `<section class="audio-settings" aria-label="사운드 설정"><div class="settings-row"><div><h3>생존약국 사운드</h3><p>잔잔한 배경음과 계산·입고·전화 효과음</p></div><button class="small-button secondary" data-action="sound" aria-pressed="${!audio.enabled}">${audio.enabled ? '소리 켜짐' : '전체 음소거'}</button></div>
 ${[
   ['master', '전체 음량'],
   ['effects', '효과음'],
   ['music', '배경음악'],
 ]
   .map(
     ([key, name]) =>
       `<label class="audio-slider" for="audio-${key}"><span>${name}</span><input id="audio-${key}" data-volume="${key}" type="range" min="0" max="100" step="1" value="${Math.round(audio.volumes[key] * 100)}"><output id="audio-value-${key}">${Math.round(audio.volumes[key] * 100)}%</output></label>`,
   )
   .join('')}
 <div class="audio-test"><button class="small-button" data-action="sound-test">♪ 소리 테스트</button><div><span id="audio-status" role="status"></span><meter id="audio-meter" min="0" max="0.2" value="0" aria-label="오디오 출력 레벨"></meter></div></div><p class="audio-help">테스트 버튼을 누르면 네 음이 들립니다. 출력 막대가 움직이는데 들리지 않으면 탭 음소거와 기기의 출력 장치를 확인해주세요. 음량은 자동으로 저장됩니다.</p></section>`;
}
