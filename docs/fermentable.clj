(defattrs :enum {:fill "#a0ffa0"})
(defattrs :bool {:fill "#ffb0a0"})
(defattrs :uint {:fill "#a0fafa"})
(defattrs :fixed {:fill "#ffffa0"})
(defattrs :varint {:fill "#e4b5f7"})

(def vlq (fn [label span]
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
	) [{:span span} :varint])
))

(def column-labels ["0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "10" "11" "12" "13" "14" "15"])

(draw-column-headers)
(draw-box "units" [{:span 2} :enum])
(draw-box "yield" [{:span 7} :uint])
(draw-box "name_len" [{:span 7} :uint])
(vlq "weight" 8)
(vlq "ebc_color" 8)
(vlq "name_len" 8)
(draw-gap "name")
(draw-bottom)
