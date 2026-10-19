# Lessons

Problems met while making Outgrow, each with what fixed it. Check the stills and drafts against this list.

| Symptom | Cause | Fix |
| --- | --- | --- |
| The finale looks like a bat with flat lines at the top | Upper petals overlap, their sum flattens the top | Keep petal bumps apart; leave a narrow channel between the wings |
| A solid white blob or pill at the node | All lines meet in one point (ε too small) or crowd one tiny region | Give each line its own small ε; pull the node into a vertical waist with `tanh` |
| The orange tail reads as a fat worm or a hook | Tail too wide or too long while orbiting | Width ≈ 0.4 × radius, at most ~17 frames of history |
| A second or more where nothing happens | The soul only returns to the centre | Add an event (rebound strike, wave) or start the next morph earlier |
| Lopsided, messy shapes just before the wings | The soul keeps pushing after the breakthrough; an asymmetric eight blends into a symmetric form | End the push ~0.5 s after the breakthrough; fade the eight's lean out before the morph |
| The frame jitters during fast orbits | Camera locked to the raw soul position | Chase a weighted average of the last 0.3 s |
| Final framing doesn't match the target frame | Moving the art to fit | Fix the final camera and derive the flight from screen points through the inverse camera |
| Words overlap the wings at the end | Final camera too high | Lower the camera centre until the wings sit below the text block, as in the target |
| Text mid-burst looks scrambled in a still | Normal: letters are in flight | Judge impact words in motion strips, not single stills |
| A thin orange line looks grey in a screenshot | Downscaled screenshot | Zoom the region or read the computed stroke before "fixing" it |
| A page shows old content after publishing | Browser and GitHub Pages cache (10 min) | Version asset URLs (`site.js?v=N`) and fetch data with `cache: "no-cache"` |
| A prompt pasted into another agent arrives broken | A fenced code block nested inside a fenced block | Describe formats in words; never nest fences in a prompt meant for copying |
| Third-party screenshots end up in a public repo | Rule only mentioned videos | Link anything made by someone else; commit only owner- or agent-made images |
