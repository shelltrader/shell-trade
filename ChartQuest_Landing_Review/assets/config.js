/* ============================================================
   CHART QUEST — SITE SETTINGS
   ------------------------------------------------------------
   This is the ONE place to change simple site-wide options.
   You do NOT need to know how to code to use it — just change
   the word  true  or  false  and save the file.
   ============================================================ */

window.CHARTQUEST_CONFIG = {

  /* -- THE BOSSES PAGE TOGGLE -------------------------------
     Show or hide the whole "Bosses" page (the list of all
     Guardians and what they teach).

        true   = the Bosses page is LIVE. It appears in the
                 top menu and anyone can open it.

        false  = the Bosses page is HIDDEN. It disappears from
                 the menu, and if someone opens the link they
                 see a friendly "coming soon" message instead.

     Just flip this between true and false and save.            */
  showBossesPage: true,


  /* -- CHECKOUT LINKS (for the two paid courses) -----------
     Paste your real checkout/payment links here when you have
     them (for example from Stripe, Gumroad, or Teachable).
     Until then the buttons open a friendly "opening soon" note. */
  checkoutFoundationsUrl: "",          // the $39.99 course
  checkoutProMasteryUrl:  "",          // the $149.99 course


  /* -- WHERE THE GAME LIVES --------------------------------
     The file that holds the actual playable game.             */
  gameUrl: "game.html"

};
