---
name: Apple iPad compatibility review
description: Apple review expectations for the iPhone-only app when run on an iPad.
---

Treat iPad compatibility mode as a required review environment even while `supportsTablet` remains disabled. Critical authentication actions must not depend on a button that can fall below a constrained viewport; four-digit PIN entry should submit immediately after the fourth digit while retaining an accessible manual action.

**Why:** Apple rejected the iPhone-only build after its reviewer entered all four PIN digits on an iPad but could not see the manual sign-in button below the viewport.

**How to apply:** Before App Store submissions, verify authentication and other blocking flows at compact iPhone and iPad compatibility dimensions, ensuring controls can scroll into view and fixed-length entry completes without requiring a hidden button.