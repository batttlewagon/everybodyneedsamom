/* ============================================================
   EVERYBODY NEEDS A MOM — VIDEO SESSIONS · SITE SETTINGS
   Plain settings anyone may see. The private ones (video room
   link, client code) live encrypted in secrets.js.
   ============================================================ */

window.SITE_CONFIG = {
  mentorName: "Shira",
  mentorFullName: "Shira",
  contactEmail: "",   // Shira's email for booking requests and questions

  // Booking calendar: the part of the Cal.com link after "cal.com/",
  // e.g. "shira/video-session". Leave "" until it's ready.
  calLink: "",

  // Optional price line shown above the calendar, e.g. "$40 per 45-minute session".
  // The real charge happens in Cal.com when someone books.
  sessionPrice: "",

  // Only used if secrets.js has no locked room. Leave "" (safer).
  dailyRoomUrl: ""
};
