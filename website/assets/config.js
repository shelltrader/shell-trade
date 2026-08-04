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

     Just flip this between true and false and save.

     SET TO false FOR THE CLOSED BETA: this page describes 11
     Guardians, and only the first one (the Gambler) is built.  */
  showBossesPage: false,


  /* -- THE COURSES PAGE TOGGLE ------------------------------
     Show or hide the whole "Academy" page (the two paid
     courses).

        true   = the Courses page is LIVE.
        false  = it is HIDDEN, and anyone who opens the link
                 sees a friendly "still being written" message.

     SET TO false FOR THE CLOSED BETA. The page advertises
     $39.99 and $149.99 courses, "over $600 of value", a
     certificate and a 30-day money-back guarantee — none of
     which exist yet. Turn it back on when they do.            */
  showCoursesPage: false,


  /* -- CHECKOUT LINKS (for the two paid courses) -----------
     Paste your real checkout/payment links here when you have
     them (for example from Stripe, Gumroad, or Teachable).
     Until a link is set here, the buy buttons say the courses
     are not for sale yet — they can never take someone's
     money, and they never show developer instructions.        */
  checkoutFoundationsUrl: "",          // the $39.99 course
  checkoutProMasteryUrl:  "",          // the $149.99 course


  /* -- WHERE THE GAME LIVES --------------------------------
     The file that holds the actual playable game.             */
  gameUrl: "game.html"

};
