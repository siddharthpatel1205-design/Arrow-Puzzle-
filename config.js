/* ================= AD SETTINGS (Adsterra) =================
   Every value below is SAMPLE code. It contains "REPLACE_WITH_YOUR..." so the game treats it as a
   placeholder: it shows a labelled box, loads nothing, and never gives a video reward.
   To go live: delete the whole sample text of ONE slot and paste the code from your Adsterra dashboard
   (Websites -> your site -> Get code). Keep the backticks `...` around it.
   The real code from Adsterra can look a little different from these samples (domain and path change per
   account), so always trust your dashboard over this file. */
window.ARROW_ADS = {

  /* 1) TOP BANNER, 320x50. Dashboard: Banner -> size 320x50. Shown on top of the game all the time. */
  topBanner: `
<script type="text/javascript">
  atOptions = {
    'key' : 'bd9f5fc266d84574158b1d2a791206d8',
    'format' : 'iframe',
    'height' : 50,
    'width' : 320,
    'params' : {}
  };
</script>
<script src="https://www.highrevenueformat.com/bd9f5fc266d84574158b1d2a791206d8/invoke.js"></script>`,

  /* 2) LEVEL-COMPLETE POPUP, 300x250. Dashboard: Banner -> size 300x250 (or a Native Banner). */
  winBanner: `
<script type="text/javascript">
  atOptions = {
    'key' : '325a09a7172c9117bf1cf211a7ef8c07',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script src="https://www.highrevenueformat.com/325a09a7172c9117bf1cf211a7ef8c07/invoke.js"></script>`,

  /* 3) GAME-OVER POPUP. Uses your Native Banner code (the container div goes along with it). */
  overBanner: `
<script async="async" data-cfasync="false" src="https://pl31790620.profitableratecpmnetwork.com/25a5a96c6100251073e3867171ea459a/invoke.js"></script>
<div id="container-25a5a96c6100251073e3867171ea459a"></div>`,

  /* 4) SOCIAL BAR. Dashboard: Social Bar. A single script, it floats over the page by itself. */
  socialBar: `<script src="https://pl31790597.profitableratecpmnetwork.com/ef/fd/c5/effdc53bc868418e4d28bc6e965b1da5.js"></script>`,

  /* 5) REWARDED VIDEO (VAST tag URL). Used for "continue after game over" and "Free coins".
        Dashboard: Video / VAST. Paste only the URL, in quotes. */
  vastTagUrl: 'https://REPLACE_WITH_YOUR_DOMAIN.invalid/REPLACE_WITH_YOUR_VAST_TAG',

  /* ---- Game rules for the video rewards (not Adsterra settings) ---- */
  continueHearts: 3,          // hearts given after a fully watched video on game over
  maxContinuesPerLevel: 1,    // how many video-continues are allowed per level
  coinsVideoReward: 20,       // coins for the "Free coins" video
  coinsVideoCooldownSec: 60   // wait between two "Free coins" videos
};
