# TIMELINE SCROLL 3D - STORYBOARD

`p` = normalized user scroll 0..1. Camera and object transforms are driven by shared p.

| p | Scene | Camera | Cap | Chibi | Content | Transition bridge |
|---|---|---|---|---|---|---|
| .00-.04 | Hero | fly through soft clouds | behind envelope | not yet visible | subtle title | cloud reveal |
| .04-.09 | Hero | dolly closer, no rotation jumps | reveal in envelope | enter from right | opening card | envelope opening |
| .09-.14 | Hero | hold | slow idle | wave | name/invite/date | readable hold |
| .14-.18 | Hero->Campus | follow hat | fly close past lens | fade | text recedes | hat occlusion |
| .18-.23 | Campus | descend into school entrance | move into depth | optional walk | school exterior | cap leads |
| .23-.34 | Campus | orbit shallow across 4 cards | small guide | walk/idle | four short memories | parallax cards |
| .34-.39 | Campus | steady on final image | settle | celebrate | final memory | large photo |
| .39-.42 | Campus->Stage | zoom through photo | hide | transition | image fills screen | photograph wipe |
| .42-.47 | Stage | dolly into auditorium | on chibi head | enter | ceremony heading | stage lights |
| .47-.53 | Stage | slow truck | attached to head | walk, diploma | one sentence | stage hold |
| .53-.57 | Stage | slight tilt following throw | thrown up | celebrate | small caption | cap leads |
| .57-.60 | Stage->Event | camera behind enlarged hat | passes lens | exit | dark/gold wash | cap wipe |
| .60-.65 | Event | settle | float small | hidden | date & title | stable reading |
| .65-.72 | Event | nearly locked | subtle idle | hidden | schedule | cards reveal |
| .72-.77 | Event | stable | small corner prop | hidden | address/map | interactive panel |
| .77-.80 | Event->RSVP | small pullback | recede | re-enter later | event card folding | card morph |
| .80-.86 | RSVP | steady | decorative | off to side | RSVP button/drawer | invite reappears |
| .86-.94 | Wishes | very slow dolly | decorative | slight idle | wishes wall | floating cards |
| .94-1.00 | Finish | settle to final composition | returns to chibi | final wave | thank you | closing tableau |

## Animation rules
- For scroll-controlled clips, seek at a deterministic time derived from p. Avoid loose one-shot triggers that drift out of sync when scrolling backwards.
- Cloud drift/blink/small particle motion can be clock-driven, but should be subtle.
- Never reinitialize the R3F Canvas between chapters.
- For camera, interpolate position and look target along a smooth curve (Catmull-Rom for positions, quaternion or smoothed look targets for orientation). A masked transition may change scene origin, but the resulting on-screen motion must be continuous.
- Provide readable pauses, focus management for drawers and no scroll hijacking in forms.
- Existing artwork is a visual reference: the entire picture is not a 3D mesh.
