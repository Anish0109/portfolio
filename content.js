// =====================================================================
//  The texts a visitor reads, and the list of videos.
//  This is the only file you need to edit to change the portfolio.
//  Keep the quotes and commas as they are; only change the words between the quotes.
// =====================================================================
window.PORTFOLIO = {

  // The lines that take turns above "Click to explore" on the first screen.
  // {Count} becomes the number of videos below ("Four"); {count} is the same in lower case.
  trailer: [
    "Hi, I'm Anish Patil.",
    "I'm an engineer who animates cars in Blender.",
    '{Count} of my animations are parked out here in the dark.',
    'Your headlights are the only way to find them.',
    'Hold your lights on one and it plays.',
  ],

  // Your videos. The first one waits straight ahead; the others are spread around the sphere.
  //   id     a short code with no spaces; the signs below use it
  //   file   where the video is, inside the videos folder (MP4 with H.264 plays in every browser)
  //   name   the title in the status line and in the viewer
  //   short  what the signs call it, as in "The Mustang is about 70° to your right"
  //   sell   one line that appears when the video grows to full size
  videos: [
    {id: 'mustang', file: 'videos/mustang-shelby-1967.mp4', name: 'Mustang drift', short: 'Mustang',
      sell: 'Animated, lit and rendered in Blender.'},
    {id: 'c63', file: 'videos/c63-teaser.mp4', name: 'C63 animation', short: 'C63',
      sell: 'Camera, light and motion, all set up in Blender.'},
    {id: 'corvette', file: 'videos/corvette.mp4', name: 'Corvette animation', short: 'Corvette',
      sell: 'Made in Blender, from the first keyframe to the final render.'},
    {id: 'ocean', file: 'videos/ocean.mp4', name: 'Ocean animation', short: 'ocean',
      sell: 'An ocean at night, made in Blender.'},
  ],

  // Floating signs out in the dark. Each one sells the work, then points at a video.
  //   to     a video id from the list above, or 'near' / 'far' for the nearest or farthest video
  //   {dir}  becomes a direction, like "about 70° to your left, a little higher"
  //   {name} becomes the short name of the video it points at
  signs: [
    {head: 'Every frame out here was made in Blender.', line: 'The nearest one is {dir}. Follow the sparks.', to: 'near'},
    {head: 'Good car animation is all about weight.', line: "See how the {name} moves. It's {dir}.", to: 'mustang'},
    {head: 'No stock footage. No templates.', line: 'Just Blender and a lot of keyframes. The {name} is {dir}.', to: 'c63'},
    {head: 'Hold your lights still and a video plays.', line: 'Try it on the {name}, {dir}.', to: 'corvette'},
    {head: 'Check your mirrors.', line: 'The {name} is {dir}.', to: 'far'},
    {head: 'Engineer by training. Animator by choice.', line: 'The proof is {dir}.', to: 'near'},
  ],
};
