export const cutscenes = {
  intro: [
    { type: "image", src: "assets/story/meadow-dawn.png", fallbackSrc: "assets/story/meadow-dawn.svg" },
    { type: "dialogue", speaker: "Guide", text: "Something is stirring in Sunmeadow." },
    { type: "dialogue", speaker: "Guide", text: "Find the cave before nightfall." },
    { type: "end" }
  ],
  partyFainted: [
    { type: "image", src: "assets/story/faint.png", fallbackSrc: "assets/story/meadow-dawn.svg" },
    { type: "dialogue", speaker: "Guide", text: "Your creatures can fight no longer." },
    { type: "dialogue", speaker: "Guide", text: "You gather them close and make your way back to safety." },
    { type: "end" }
  ]
};
