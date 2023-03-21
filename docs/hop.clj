(defattrs :enum {:fill "#a0ffa0"})
(defattrs :bool {:fill "#ffb0a0"})
(defattrs :uint {:fill "#a0fafa"})
(defattrs :fixed {:fill "#ffffa0"})
(defattrs :varint {:fill "#e4b5f7"})

(def vlqcolor (fn [label span color]
	(draw-box (fn [left top width height]
		(append-svg (text label {
			:x (/ (+ left left width) 2.0)
			:y (+ top 1 (/ height 2.0))
			:text-anchor "middle"
			:dominant-baseline "middle"
			:font-size 16
			:font-family "sans-serif"
		}))
		(draw-line (- (+ left width) 5) top (- (+ left width) 15) (+ top height) :border-related)
		(draw-line (- (+ left width) 10) top (- (+ left width) 20) (+ top height) :border-related)
	) [{:span span} color])
))

(def vlq (fn [label span]
	(vlqcolor label span :varint)
))

(def column-labels ["0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "10" "11" "12" "13" "14" "15"])

(draw-column-headers)
(draw-box "time" [{:span 3} :enum])
(draw-box "wt" [{:span 1} :bool])
(draw-box "form" [{:span 2} :enum])
(draw-box "use" [{:span 2} :enum])
(next-row)
(draw-box "if time == 0b111, then:" {:span 16 :borders #{}})
(next-row)
(draw-column-headers)
(vlq "custom_time" 8)
(next-row)
(draw-box "end if" {:span 16 :borders #{}})
(next-row)
(draw-box "if wt, then:" {:span 16 :borders #{}})
(next-row)
(draw-column-headers)
(vlq "grams" 8)
(next-row)
(draw-box "end if" {:span 16 :borders #{}})
(next-row)
(draw-column-headers)
(vlqcolor "alpha_acid.1" 8 :fixed)
(vlq "name_len" 8)
(draw-gap "name")
(draw-bottom)
