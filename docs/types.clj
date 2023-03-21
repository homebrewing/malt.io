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


(draw-box "Color &amp; Type Key" {:span 16 :borders #{}})
(draw-box "enum" [{:span 3} :enum])
(draw-box "bool" [{:span 3} :bool])
(draw-box "uint" [{:span 3} :uint])
(draw-box "fixed" [{:span 3} :fixed])
(vlq "vlq/varint" 4)
(draw-gap "variable length bytes")
(draw-bottom)
