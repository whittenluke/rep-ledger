-- Rep Ledger — System Exercise Seed
-- user_id = null means system/default exercise (read-only to users)
-- type: 'reps' = log reps + weight per set | 'time' = log duration in seconds per set

insert into exercises (user_id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, is_bodyweight, notes, type) values

-- ============================================================
-- PUSH — Horizontal (Chest)
-- ============================================================
(null, 'Bench Press', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Barbell', false, 'Flat bench. Primary chest mass builder.', 'reps'),
(null, 'Incline Bench Press', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Barbell', false, 'Upper chest emphasis.', 'reps'),
(null, 'Decline Bench Press', 'Pectorals', array['Triceps'], 'Push', 'Barbell', false, 'Lower chest emphasis.', 'reps'),
(null, 'Dumbbell Bench Press', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Dumbbell', false, 'Greater range of motion than barbell.', 'reps'),
(null, 'Incline Dumbbell Press', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Dumbbell', false, 'Upper chest with dumbbells.', 'reps'),
(null, 'Decline Dumbbell Press', 'Pectorals', array['Triceps'], 'Push', 'Dumbbell', false, null, 'reps'),
(null, 'Dumbbell Fly', 'Pectorals', array['Deltoids'], 'Push', 'Dumbbell', false, null, 'reps'),
(null, 'Incline Dumbbell Fly', 'Pectorals', array['Deltoids'], 'Push', 'Dumbbell', false, 'Upper chest stretch emphasis.', 'reps'),
(null, 'Cable Chest Fly', 'Pectorals', array['Deltoids'], 'Push', 'Cable', false, 'Constant tension throughout movement.', 'reps'),
(null, 'Low Cable Fly', 'Pectorals', array['Deltoids'], 'Push', 'Cable', false, 'Cables set low, crossing upward. Upper chest.', 'reps'),
(null, 'High Cable Fly', 'Pectorals', array['Deltoids'], 'Push', 'Cable', false, 'Cables set high, crossing downward. Lower chest.', 'reps'),
(null, 'Pec Deck', 'Pectorals', array['Deltoids'], 'Push', 'Machine', false, 'Machine fly. Good for isolation at end of session.', 'reps'),
(null, 'Chest Press Machine', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Machine', false, null, 'reps'),
(null, 'Push Up', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Bodyweight', true, null, 'reps'),
(null, 'Wide Grip Push Up', 'Pectorals', array['Deltoids'], 'Push', 'Bodyweight', true, 'Wider hand placement increases chest stretch.', 'reps'),
(null, 'Decline Push Up', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Bodyweight', true, 'Feet elevated. Upper chest emphasis.', 'reps'),
(null, 'Incline Push Up', 'Pectorals', array['Deltoids', 'Triceps'], 'Push', 'Bodyweight', true, 'Hands elevated. Easier variation, good for beginners.', 'reps'),
(null, 'Chest Dip', 'Pectorals', array['Triceps', 'Deltoids'], 'Push', 'Bodyweight', true, 'Lean forward to shift emphasis to chest over triceps.', 'reps'),

-- ============================================================
-- PUSH — Vertical (Shoulders)
-- ============================================================
(null, 'Overhead Press', 'Deltoids', array['Triceps', 'Trapezius', 'Core'], 'Push', 'Barbell', false, 'Standing barbell press. Also called OHP or military press.', 'reps'),
(null, 'Seated Overhead Press', 'Deltoids', array['Triceps', 'Trapezius'], 'Push', 'Barbell', false, null, 'reps'),
(null, 'Dumbbell Shoulder Press', 'Deltoids', array['Triceps', 'Trapezius'], 'Push', 'Dumbbell', false, null, 'reps'),
(null, 'Seated Dumbbell Shoulder Press', 'Deltoids', array['Triceps', 'Trapezius'], 'Push', 'Dumbbell', false, null, 'reps'),
(null, 'Arnold Press', 'Deltoids', array['Triceps', 'Trapezius'], 'Push', 'Dumbbell', false, 'Rotating press. Hits all three deltoid heads.', 'reps'),
(null, 'Lateral Raise', 'Deltoids', array[]::text[], 'Push', 'Dumbbell', false, 'Side deltoid isolation. Keep slight bend in elbow.', 'reps'),
(null, 'Cable Lateral Raise', 'Deltoids', array[]::text[], 'Push', 'Cable', false, 'Constant tension vs dumbbell version.', 'reps'),
(null, 'Front Raise', 'Deltoids', array[]::text[], 'Push', 'Dumbbell', false, 'Anterior deltoid isolation.', 'reps'),
(null, 'Barbell Front Raise', 'Deltoids', array[]::text[], 'Push', 'Barbell', false, null, 'reps'),
(null, 'Rear Delt Fly', 'Deltoids', array['Rhomboids', 'Trapezius'], 'Pull', 'Dumbbell', false, 'Posterior deltoid. Bent over or on incline bench.', 'reps'),
(null, 'Cable Rear Delt Fly', 'Deltoids', array['Rhomboids'], 'Pull', 'Cable', false, 'Face away from cable stack, arms cross at chest height.', 'reps'),
(null, 'Machine Shoulder Press', 'Deltoids', array['Triceps'], 'Push', 'Machine', false, null, 'reps'),
(null, 'Pike Push Up', 'Deltoids', array['Triceps'], 'Push', 'Bodyweight', true, 'Hips high, targets shoulders more than regular push up.', 'reps'),
(null, 'Handstand Push Up', 'Deltoids', array['Triceps', 'Trapezius'], 'Push', 'Bodyweight', true, 'Advanced. Use wall for support.', 'reps'),

-- ============================================================
-- PUSH — Triceps
-- ============================================================
(null, 'Tricep Pushdown', 'Triceps', array[]::text[], 'Push', 'Cable', false, 'Rope or bar attachment.', 'reps'),
(null, 'Overhead Tricep Extension', 'Triceps', array[]::text[], 'Push', 'Dumbbell', false, 'Single or double arm.', 'reps'),
(null, 'Cable Overhead Tricep Extension', 'Triceps', array[]::text[], 'Push', 'Cable', false, null, 'reps'),
(null, 'Skull Crusher', 'Triceps', array[]::text[], 'Push', 'Barbell', false, 'EZ bar or straight bar. Lying tricep extension.', 'reps'),
(null, 'Dumbbell Skull Crusher', 'Triceps', array[]::text[], 'Push', 'Dumbbell', false, null, 'reps'),
(null, 'Close Grip Bench Press', 'Triceps', array['Pectorals'], 'Push', 'Barbell', false, 'Narrower grip shifts load to triceps.', 'reps'),
(null, 'Tricep Dip', 'Triceps', array['Pectorals', 'Deltoids'], 'Push', 'Bodyweight', true, 'Upright torso emphasizes triceps.', 'reps'),
(null, 'Bench Dip', 'Triceps', array['Deltoids'], 'Push', 'Bodyweight', true, 'Hands on bench behind you. Easier than parallel bar dip.', 'reps'),
(null, 'Diamond Push Up', 'Triceps', array['Pectorals', 'Deltoids'], 'Push', 'Bodyweight', true, 'Hands form a diamond shape under chest.', 'reps'),
(null, 'Single Arm Tricep Pushdown', 'Triceps', array[]::text[], 'Push', 'Cable', false, null, 'reps'),

-- ============================================================
-- PULL — Horizontal (Back / Rows)
-- ============================================================
(null, 'Barbell Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids', 'Trapezius'], 'Pull', 'Barbell', false, 'Bent over. Overhand grip.', 'reps'),
(null, 'Pendlay Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids', 'Trapezius'], 'Pull', 'Barbell', false, 'Bar returns to floor each rep. Strict form.', 'reps'),
(null, 'Underhand Barbell Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids'], 'Pull', 'Barbell', false, 'Supinated grip. More bicep involvement.', 'reps'),
(null, 'Dumbbell Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids'], 'Pull', 'Dumbbell', false, 'Single arm. Brace on bench.', 'reps'),
(null, 'Seated Cable Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids', 'Trapezius'], 'Pull', 'Cable', false, 'Close or wide grip. Keep torso upright.', 'reps'),
(null, 'Wide Grip Cable Row', 'Rhomboids', array['Latissimus Dorsi', 'Trapezius'], 'Pull', 'Cable', false, 'Wider grip shifts emphasis to upper back.', 'reps'),
(null, 'Machine Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids'], 'Pull', 'Machine', false, null, 'reps'),
(null, 'Chest Supported Row', 'Rhomboids', array['Latissimus Dorsi', 'Biceps'], 'Pull', 'Machine', false, 'Chest pad removes lower back from equation.', 'reps'),
(null, 'T-Bar Row', 'Latissimus Dorsi', array['Biceps', 'Rhomboids', 'Trapezius'], 'Pull', 'Barbell', false, null, 'reps'),
(null, 'Inverted Row', 'Rhomboids', array['Biceps', 'Latissimus Dorsi'], 'Pull', 'Bodyweight', true, 'Bar in rack at waist height. Body horizontal.', 'reps'),
(null, 'Face Pull', 'Deltoids', array['Rhomboids', 'Trapezius', 'Rotator Cuff'], 'Pull', 'Cable', false, 'Rope attachment at head height. Great for shoulder health.', 'reps'),
(null, 'Shrug', 'Trapezius', array[]::text[], 'Pull', 'Barbell', false, 'Barbell or dumbbell. Straight up, no rolling.', 'reps'),
(null, 'Dumbbell Shrug', 'Trapezius', array[]::text[], 'Pull', 'Dumbbell', false, null, 'reps'),

-- ============================================================
-- PULL — Vertical (Pull Ups / Lat Pulldowns)
-- ============================================================
(null, 'Pull Up', 'Latissimus Dorsi', array['Biceps', 'Rhomboids'], 'Pull', 'Bodyweight', true, 'Overhand grip, shoulder width or wider.', 'reps'),
(null, 'Chin Up', 'Latissimus Dorsi', array['Biceps', 'Pectorals'], 'Pull', 'Bodyweight', true, 'Underhand grip. More bicep involvement than pull up.', 'reps'),
(null, 'Neutral Grip Pull Up', 'Latissimus Dorsi', array['Biceps'], 'Pull', 'Bodyweight', true, 'Palms facing each other. Easier on shoulders.', 'reps'),
(null, 'Weighted Pull Up', 'Latissimus Dorsi', array['Biceps', 'Rhomboids'], 'Pull', 'Bodyweight', false, 'Use belt or hold dumbbell between feet.', 'reps'),
(null, 'Lat Pulldown', 'Latissimus Dorsi', array['Biceps', 'Rhomboids'], 'Pull', 'Cable', false, 'Wide overhand grip.', 'reps'),
(null, 'Close Grip Lat Pulldown', 'Latissimus Dorsi', array['Biceps'], 'Pull', 'Cable', false, 'Neutral grip attachment.', 'reps'),
(null, 'Straight Arm Pulldown', 'Latissimus Dorsi', array[]::text[], 'Pull', 'Cable', false, 'Arms stay straight. Pure lat isolation.', 'reps'),
(null, 'Single Arm Lat Pulldown', 'Latissimus Dorsi', array['Biceps'], 'Pull', 'Cable', false, null, 'reps'),

-- ============================================================
-- PULL — Biceps
-- ============================================================
(null, 'Barbell Curl', 'Biceps', array['Forearms'], 'Pull', 'Barbell', false, null, 'reps'),
(null, 'EZ Bar Curl', 'Biceps', array['Forearms'], 'Pull', 'Barbell', false, 'Easier on wrists than straight bar.', 'reps'),
(null, 'Dumbbell Curl', 'Biceps', array['Forearms'], 'Pull', 'Dumbbell', false, null, 'reps'),
(null, 'Hammer Curl', 'Biceps', array['Forearms', 'Brachialis'], 'Pull', 'Dumbbell', false, 'Neutral grip. Hits brachialis and forearms more.', 'reps'),
(null, 'Incline Dumbbell Curl', 'Biceps', array[]::text[], 'Pull', 'Dumbbell', false, 'Seated on incline bench. Greater stretch at bottom.', 'reps'),
(null, 'Concentration Curl', 'Biceps', array[]::text[], 'Pull', 'Dumbbell', false, 'Elbow braced on inner thigh. Good peak contraction.', 'reps'),
(null, 'Cable Curl', 'Biceps', array['Forearms'], 'Pull', 'Cable', false, 'Constant tension.', 'reps'),
(null, 'Preacher Curl', 'Biceps', array[]::text[], 'Pull', 'Barbell', false, 'Arm braced on preacher pad. Removes cheating.', 'reps'),
(null, 'Dumbbell Preacher Curl', 'Biceps', array[]::text[], 'Pull', 'Dumbbell', false, null, 'reps'),
(null, 'Reverse Curl', 'Forearms', array['Biceps'], 'Pull', 'Barbell', false, 'Overhand grip. Forearm and brachialis emphasis.', 'reps'),
(null, 'Zottman Curl', 'Biceps', array['Forearms', 'Brachialis'], 'Pull', 'Dumbbell', false, 'Supinate up, pronate down. Works both heads.', 'reps'),
(null, 'Cable Hammer Curl', 'Biceps', array['Forearms'], 'Pull', 'Cable', false, 'Rope attachment.', 'reps'),

-- ============================================================
-- SQUAT
-- ============================================================
(null, 'Barbell Back Squat', 'Quadriceps', array['Glutes', 'Hamstrings', 'Core'], 'Squat', 'Barbell', false, 'High bar or low bar. King of leg exercises.', 'reps'),
(null, 'Front Squat', 'Quadriceps', array['Glutes', 'Core'], 'Squat', 'Barbell', false, 'Bar on front of shoulders. More upright torso.', 'reps'),
(null, 'Goblet Squat', 'Quadriceps', array['Glutes', 'Core'], 'Squat', 'Dumbbell', false, 'Hold dumbbell or kettlebell at chest. Good for learning squat pattern.', 'reps'),
(null, 'Dumbbell Squat', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Dumbbell', false, null, 'reps'),
(null, 'Leg Press', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Machine', false, 'Foot position changes emphasis.', 'reps'),
(null, 'Hack Squat', 'Quadriceps', array['Glutes'], 'Squat', 'Machine', false, null, 'reps'),
(null, 'Bulgarian Split Squat', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Dumbbell', false, 'Rear foot elevated. Brutal single leg exercise.', 'reps'),
(null, 'Barbell Split Squat', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Barbell', false, null, 'reps'),
(null, 'Lunge', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Bodyweight', true, 'Forward, reverse, or walking.', 'reps'),
(null, 'Dumbbell Lunge', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Dumbbell', false, null, 'reps'),
(null, 'Walking Lunge', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Dumbbell', false, null, 'reps'),
(null, 'Reverse Lunge', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Bodyweight', true, 'Easier on knees than forward lunge.', 'reps'),
(null, 'Step Up', 'Quadriceps', array['Glutes'], 'Squat', 'Dumbbell', false, 'Step onto elevated surface.', 'reps'),
(null, 'Pistol Squat', 'Quadriceps', array['Glutes', 'Core'], 'Squat', 'Bodyweight', true, 'Single leg squat. Advanced.', 'reps'),
(null, 'Box Squat', 'Quadriceps', array['Glutes', 'Hamstrings'], 'Squat', 'Barbell', false, 'Sit back to box. Good for teaching hip hinge in squat.', 'reps'),
(null, 'Wall Sit', 'Quadriceps', array['Glutes'], 'Squat', 'Bodyweight', true, 'Isometric hold at 90 degrees.', 'time'),
(null, 'Leg Extension', 'Quadriceps', array[]::text[], 'Squat', 'Machine', false, 'Isolation. Use moderate weight.', 'reps'),
(null, 'Sissy Squat', 'Quadriceps', array[]::text[], 'Squat', 'Bodyweight', true, 'Extreme quad stretch. Advanced.', 'reps'),

-- ============================================================
-- HINGE
-- ============================================================
(null, 'Deadlift', 'Hamstrings', array['Glutes', 'Latissimus Dorsi', 'Trapezius', 'Core'], 'Hinge', 'Barbell', false, 'Conventional stance. Full posterior chain.', 'reps'),
(null, 'Sumo Deadlift', 'Glutes', array['Hamstrings', 'Quadriceps', 'Latissimus Dorsi'], 'Hinge', 'Barbell', false, 'Wide stance. More glute and inner thigh.', 'reps'),
(null, 'Romanian Deadlift', 'Hamstrings', array['Glutes', 'Latissimus Dorsi'], 'Hinge', 'Barbell', false, 'Bar stays close to legs, hips hinge back. No floor contact.', 'reps'),
(null, 'Dumbbell Romanian Deadlift', 'Hamstrings', array['Glutes'], 'Hinge', 'Dumbbell', false, null, 'reps'),
(null, 'Single Leg Romanian Deadlift', 'Hamstrings', array['Glutes', 'Core'], 'Hinge', 'Dumbbell', false, 'Great for balance and hamstring isolation.', 'reps'),
(null, 'Stiff Leg Deadlift', 'Hamstrings', array['Glutes', 'Latissimus Dorsi'], 'Hinge', 'Barbell', false, 'Knees nearly locked. Maximum hamstring stretch.', 'reps'),
(null, 'Trap Bar Deadlift', 'Quadriceps', array['Hamstrings', 'Glutes', 'Trapezius'], 'Hinge', 'Barbell', false, 'Hex bar. More quad involvement, easier on lower back.', 'reps'),
(null, 'Kettlebell Swing', 'Glutes', array['Hamstrings', 'Core', 'Deltoids'], 'Hinge', 'Kettlebell', false, 'Explosive hip drive. Ballistic movement.', 'reps'),
(null, 'Good Morning', 'Hamstrings', array['Glutes', 'Lower Back'], 'Hinge', 'Barbell', false, 'Bar on back, hinge at hips. Teaches hip hinge pattern.', 'reps'),
(null, 'Hip Thrust', 'Glutes', array['Hamstrings', 'Core'], 'Hinge', 'Barbell', false, 'Shoulders on bench, bar on hips. Best glute exercise.', 'reps'),
(null, 'Dumbbell Hip Thrust', 'Glutes', array['Hamstrings'], 'Hinge', 'Dumbbell', false, null, 'reps'),
(null, 'Glute Bridge', 'Glutes', array['Hamstrings', 'Core'], 'Hinge', 'Bodyweight', true, 'Floor variation of hip thrust. Good for beginners.', 'reps'),
(null, 'Cable Pull Through', 'Glutes', array['Hamstrings'], 'Hinge', 'Cable', false, 'Rope between legs, hinge back into cable.', 'reps'),
(null, 'Leg Curl', 'Hamstrings', array[]::text[], 'Hinge', 'Machine', false, 'Lying or seated. Hamstring isolation.', 'reps'),
(null, 'Nordic Curl', 'Hamstrings', array[]::text[], 'Hinge', 'Bodyweight', true, 'Feet anchored, lower body to floor. Very difficult.', 'reps'),
(null, 'Back Extension', 'Lower Back', array['Glutes', 'Hamstrings'], 'Hinge', 'Bodyweight', true, 'On GHD or 45-degree bench.', 'reps'),
(null, 'Weighted Back Extension', 'Lower Back', array['Glutes', 'Hamstrings'], 'Hinge', 'Machine', false, null, 'reps'),
(null, 'Calf Raise', 'Calves', array[]::text[], 'Hinge', 'Bodyweight', true, 'Standing. Can add weight via dumbbell or machine.', 'reps'),
(null, 'Seated Calf Raise', 'Calves', array[]::text[], 'Hinge', 'Machine', false, 'Seated version isolates soleus more.', 'reps'),
(null, 'Donkey Calf Raise', 'Calves', array[]::text[], 'Hinge', 'Machine', false, null, 'reps'),

-- ============================================================
-- CARRY
-- ============================================================
(null, 'Farmer Carry', 'Forearms', array['Trapezius', 'Core', 'Quadriceps'], 'Carry', 'Dumbbell', false, 'Walk with heavy dumbbells or kettlebells at sides.', 'time'),
(null, 'Suitcase Carry', 'Core', array['Forearms', 'Trapezius'], 'Carry', 'Dumbbell', false, 'Single arm. Anti-lateral flexion challenge.', 'time'),
(null, 'Overhead Carry', 'Deltoids', array['Core', 'Trapezius'], 'Carry', 'Dumbbell', false, 'Weight held overhead. Serious stability demand.', 'time'),
(null, 'Zercher Carry', 'Core', array['Biceps', 'Trapezius'], 'Carry', 'Barbell', false, 'Bar in crook of elbows.', 'time'),

-- ============================================================
-- CORE
-- ============================================================
(null, 'Plank', 'Core', array['Deltoids', 'Glutes'], 'Core', 'Bodyweight', true, 'Forearms or hands. Keep hips level.', 'time'),
(null, 'Side Plank', 'Core', array['Glutes', 'Deltoids'], 'Core', 'Bodyweight', true, 'Lateral core stability.', 'time'),
(null, 'Hollow Hold', 'Core', array[]::text[], 'Core', 'Bodyweight', true, 'Lower back pressed to floor, legs and shoulders raised.', 'time'),
(null, 'Dead Bug', 'Core', array[]::text[], 'Core', 'Bodyweight', true, 'Opposite arm and leg extend while keeping lower back flat.', 'reps'),
(null, 'Ab Wheel Rollout', 'Core', array['Latissimus Dorsi', 'Deltoids'], 'Core', 'Bodyweight', true, 'On knees or standing. Very challenging.', 'reps'),
(null, 'Cable Crunch', 'Core', array[]::text[], 'Core', 'Cable', false, 'Kneeling, rope attachment overhead.', 'reps'),
(null, 'Crunch', 'Core', array[]::text[], 'Core', 'Bodyweight', true, null, 'reps'),
(null, 'Bicycle Crunch', 'Core', array[]::text[], 'Core', 'Bodyweight', true, 'Rotation hits obliques.', 'reps'),
(null, 'Leg Raise', 'Core', array[]::text[], 'Core', 'Bodyweight', true, 'Lying flat. Lower abs emphasis.', 'reps'),
(null, 'Hanging Leg Raise', 'Core', array['Forearms'], 'Core', 'Bodyweight', true, 'From pull up bar. Harder than lying version.', 'reps'),
(null, 'Hanging Knee Raise', 'Core', array['Forearms'], 'Core', 'Bodyweight', true, 'Easier version of hanging leg raise.', 'reps'),
(null, 'Toes to Bar', 'Core', array['Forearms', 'Latissimus Dorsi'], 'Core', 'Bodyweight', true, 'Full range hanging leg raise.', 'reps'),
(null, 'Russian Twist', 'Core', array[]::text[], 'Core', 'Bodyweight', true, 'Add weight for more challenge.', 'reps'),
(null, 'Pallof Press', 'Core', array[]::text[], 'Core', 'Cable', false, 'Anti-rotation. Cable at chest height, press straight out.', 'reps'),
(null, 'Mountain Climber', 'Core', array['Deltoids', 'Quadriceps'], 'Core', 'Bodyweight', true, null, 'reps'),
(null, 'V-Up', 'Core', array[]::text[], 'Core', 'Bodyweight', true, 'Legs and torso meet in middle.', 'reps'),
(null, 'Sit Up', 'Core', array['Hip Flexors'], 'Core', 'Bodyweight', true, null, 'reps'),
(null, 'Decline Sit Up', 'Core', array['Hip Flexors'], 'Core', 'Machine', false, null, 'reps'),
(null, 'Woodchop', 'Core', array['Deltoids', 'Obliques'], 'Core', 'Cable', false, 'Rotational. High to low or low to high.', 'reps'),
(null, 'Dragon Flag', 'Core', array['Latissimus Dorsi'], 'Core', 'Bodyweight', true, 'Advanced. Made famous by Bruce Lee.', 'reps'),

-- ============================================================
-- CARDIO / CONDITIONING
-- ============================================================
(null, 'Treadmill Run', 'Quadriceps', array['Hamstrings', 'Calves', 'Core'], 'Carry', 'Machine', false, null, 'time'),
(null, 'Stationary Bike', 'Quadriceps', array['Hamstrings', 'Calves'], 'Squat', 'Machine', false, null, 'time'),
(null, 'Rowing Machine', 'Latissimus Dorsi', array['Hamstrings', 'Core', 'Biceps'], 'Pull', 'Machine', false, 'Full body. One of the best cardio machines.', 'time'),
(null, 'Stair Climber', 'Glutes', array['Quadriceps', 'Calves'], 'Squat', 'Machine', false, null, 'time'),
(null, 'Jump Rope', 'Calves', array['Core', 'Deltoids'], 'Carry', 'Bodyweight', true, null, 'time'),
(null, 'Burpee', 'Core', array['Quadriceps', 'Pectorals', 'Deltoids'], 'Core', 'Bodyweight', true, 'Full body conditioning.', 'reps'),
(null, 'Box Jump', 'Quadriceps', array['Glutes', 'Calves'], 'Squat', 'Bodyweight', true, 'Explosive. Land softly.', 'reps'),
(null, 'Battle Ropes', 'Deltoids', array['Core', 'Forearms'], 'Carry', 'Bodyweight', false, null, 'time');