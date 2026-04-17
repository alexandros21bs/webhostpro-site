(function () {
	"use strict";

	var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var MAX_DPR = 1.6;
	var MODE_STORAGE_KEY = "whp_fx_mode";
	var MODE_PRESETS = {
		ultra: {
			labelEn: "FX Ultra",
			labelEl: "FX Ultra",
			density: 1.32,
			glow: 1.42,
			line: 1.26,
			node: 1.18,
			pulse: 1.35,
			pulseDuration: 2100
		},
		intense: {
			labelEn: "FX Intense",
			labelEl: "FX Εντονο",
			density: 1.12,
			glow: 1.15,
			line: 1.12,
			node: 1.08,
			pulse: 1.2,
			pulseDuration: 1800
		},
		soft: {
			labelEn: "FX Soft",
			labelEl: "FX Ηπιο",
			density: 0.78,
			glow: 0.68,
			line: 0.75,
			node: 0.82,
			pulse: 0.62,
			pulseDuration: 1500
		}
	};
	var savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
	var fxState = {
		mode: savedMode === "soft" || savedMode === "ultra" ? savedMode : "intense"
	};
	var DEFAULT_THEME = {
		nodeColors: ["#8fd0ff", "#79bcff", "#67a9ff", "#a5dcff"],
		lineColor: "143, 208, 255",
		glowColor: "121, 188, 255"
	};
	var SECTION_THEMES = {
		hero: {
			nodeColors: ["#9cd6ff", "#79bcff", "#5f9fff", "#b3e0ff"],
			lineColor: "139, 204, 255",
			glowColor: "104, 176, 255"
		},
		services: {
			nodeColors: ["#7cc7ff", "#65b5ff", "#4da1ff", "#a9ddff"],
			lineColor: "108, 183, 255",
			glowColor: "86, 154, 255"
		},
		"why-us": {
			nodeColors: ["#9fe0ff", "#7dd2ff", "#66bcff", "#c6eeff"],
			lineColor: "136, 216, 255",
			glowColor: "109, 189, 255"
		},
		contact: {
			nodeColors: ["#9fd4ff", "#79b8ff", "#66a0ff", "#c7e2ff"],
			lineColor: "129, 188, 255",
			glowColor: "100, 151, 255"
		}
	};

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function rand(min, max) {
		return Math.random() * (max - min) + min;
	}

	function resolveTheme(section) {
		if (!section || !section.id || !SECTION_THEMES[section.id]) {
			return DEFAULT_THEME;
		}

		return SECTION_THEMES[section.id];
	}

	function getModePreset() {
		return MODE_PRESETS[fxState.mode] || MODE_PRESETS.intense;
	}

	function supportsUltraMode() {
		if (typeof window.matchMedia !== "function") {
			return false;
		}

		return window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
	}

	function allowedModes() {
		return supportsUltraMode() ? ["soft", "intense", "ultra"] : ["soft", "intense"];
	}

	function normalizeMode(mode) {
		var modes = allowedModes();
		for (var i = 0; i < modes.length; i += 1) {
			if (modes[i] === mode) {
				return mode;
			}
		}

		return "intense";
	}

	function isGreekLanguage() {
		return document.documentElement.lang === "el";
	}

	function hexToRgbString(hexColor) {
		var safeHex = (hexColor || "#8fd0ff").replace("#", "");
		var value = safeHex.length === 3
			? safeHex.charAt(0) + safeHex.charAt(0) + safeHex.charAt(1) + safeHex.charAt(1) + safeHex.charAt(2) + safeHex.charAt(2)
			: safeHex;
		var parsed = parseInt(value, 16);
		if (Number.isNaN(parsed)) {
			return "143, 208, 255";
		}

		var r = (parsed >> 16) & 255;
		var g = (parsed >> 8) & 255;
		var b = parsed & 255;
		return r + ", " + g + ", " + b;
	}

	function NeuralSectionEffect(section) {
		this.section = section;
		this.theme = resolveTheme(section);
		this.canvas = document.createElement("canvas");
		this.canvas.className = "neural-bg-canvas";
		this.ctx = this.canvas.getContext("2d", { alpha: true });
		this.nodes = [];
		this.pulses = [];
		this.pointer = { x: 0.5, y: 0.5, active: false };
		this.width = 0;
		this.height = 0;
		this.dpr = 1;
		this.isVisible = true;

		if (!this.ctx) {
			return;
		}

		this.section.appendChild(this.canvas);
		this.attachPointerListeners();
		this.attachPulseListeners();
		this.resize();
	}

	NeuralSectionEffect.prototype.attachPointerListeners = function () {
		var self = this;

		this.section.addEventListener("mousemove", function (event) {
			var rect = self.section.getBoundingClientRect();
			self.pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
			self.pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
			self.pointer.active = true;
		});

		this.section.addEventListener("mouseleave", function () {
			self.pointer.active = false;
		});

		this.section.addEventListener(
			"touchmove",
			function (event) {
				if (!event.touches || event.touches.length === 0) {
					return;
				}

				var rect = self.section.getBoundingClientRect();
				self.pointer.x = clamp((event.touches[0].clientX - rect.left) / rect.width, 0, 1);
				self.pointer.y = clamp((event.touches[0].clientY - rect.top) / rect.height, 0, 1);
				self.pointer.active = true;
			},
			{ passive: true }
		);

		this.section.addEventListener("touchend", function () {
			self.pointer.active = false;
		});
	};

	NeuralSectionEffect.prototype.attachPulseListeners = function () {
		var self = this;

		this.section.addEventListener("click", function (event) {
			self.addPulse(event.clientX, event.clientY);
		});

		this.section.addEventListener(
			"touchstart",
			function (event) {
				if (!event.touches || event.touches.length === 0) {
					return;
				}
				self.addPulse(event.touches[0].clientX, event.touches[0].clientY);
			},
			{ passive: true }
		);
	};

	NeuralSectionEffect.prototype.addPulse = function (clientX, clientY) {
		var rect = this.section.getBoundingClientRect();
		var pulseX = clamp(clientX - rect.left, 0, rect.width);
		var pulseY = clamp(clientY - rect.top, 0, rect.height);
		var color = this.theme.nodeColors[Math.floor(rand(0, this.theme.nodeColors.length))];

		this.pulses.push({
			x: pulseX,
			y: pulseY,
			startTime: performance.now(),
			color: hexToRgbString(color)
		});

		if (this.pulses.length > 6) {
			this.pulses.shift();
		}
	};

	NeuralSectionEffect.prototype.resize = function () {
		this.width = Math.max(1, this.section.clientWidth);
		this.height = Math.max(1, this.section.clientHeight);
		this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

		this.canvas.width = Math.floor(this.width * this.dpr);
		this.canvas.height = Math.floor(this.height * this.dpr);
		this.canvas.style.width = this.width + "px";
		this.canvas.style.height = this.height + "px";
		this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

		this.buildNodes();
	};

	NeuralSectionEffect.prototype.buildNodes = function () {
		var area = this.width * this.height;
		var preset = getModePreset();
		var nodeCount = clamp(Math.round((area / 18000) * preset.density), 14, 58);
		this.nodes = [];

		for (var i = 0; i < nodeCount; i += 1) {
			this.nodes.push({
				x: rand(0, this.width),
				y: rand(0, this.height),
				vx: rand(-0.12, 0.12),
				vy: rand(-0.1, 0.1),
				radius: rand(1.3, 2.6),
				pulseSeed: rand(0, Math.PI * 2),
				color: this.theme.nodeColors[Math.floor(rand(0, this.theme.nodeColors.length))]
			});
		}
	};

	NeuralSectionEffect.prototype.updatePulses = function (now) {
		var preset = getModePreset();
		var pulseDuration = preset.pulseDuration;
		var active = [];
		for (var i = 0; i < this.pulses.length; i += 1) {
			if (now - this.pulses[i].startTime <= pulseDuration) {
				active.push(this.pulses[i]);
			}
		}
		this.pulses = active;
	};

	NeuralSectionEffect.prototype.getPulseBoost = function (x, y, now) {
		if (!this.pulses.length) {
			return 0;
		}

		var preset = getModePreset();
		var pulseDuration = preset.pulseDuration;
		var boost = 0;
		var maxRadius = Math.max(this.width, this.height) * 0.45;
		for (var i = 0; i < this.pulses.length; i += 1) {
			var pulse = this.pulses[i];
			var elapsed = now - pulse.startTime;
			var progress = clamp(elapsed / pulseDuration, 0, 1);
			var ringRadius = progress * maxRadius;
			var dist = Math.sqrt((x - pulse.x) * (x - pulse.x) + (y - pulse.y) * (y - pulse.y));
			var wave = 1 - clamp(Math.abs(dist - ringRadius) / (48 + (1 - preset.pulse) * 20), 0, 1);
			boost += wave * (1 - progress);
		}

		return clamp(boost * preset.pulse, 0, 1.4);
	};

	NeuralSectionEffect.prototype.drawPulses = function (now) {
		if (!this.pulses.length) {
			return;
		}

		var ctx = this.ctx;
		var preset = getModePreset();
		var pulseDuration = preset.pulseDuration;
		var maxRadius = Math.max(this.width, this.height) * 0.45;
		for (var i = 0; i < this.pulses.length; i += 1) {
			var pulse = this.pulses[i];
			var elapsed = now - pulse.startTime;
			var progress = clamp(elapsed / pulseDuration, 0, 1);
			var radius = progress * maxRadius;
			var alpha = (1 - progress) * 0.55 * preset.pulse;

			ctx.strokeStyle = "rgba(" + pulse.color + ", " + alpha.toFixed(3) + ")";
			ctx.lineWidth = (2.1 - progress * 1.1) * preset.pulse;
			ctx.beginPath();
			ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
			ctx.stroke();

			ctx.fillStyle = "rgba(" + pulse.color + ", " + (alpha * 0.2).toFixed(3) + ")";
			ctx.beginPath();
			ctx.arc(pulse.x, pulse.y, Math.max(8, radius * 0.18), 0, Math.PI * 2);
			ctx.fill();
		}
	};

	NeuralSectionEffect.prototype.updateNodes = function (t) {
		var pointerX = this.pointer.x * this.width;
		var pointerY = this.pointer.y * this.height;

		for (var i = 0; i < this.nodes.length; i += 1) {
			var node = this.nodes[i];
			node.x += node.vx;
			node.y += node.vy;

			if (node.x <= 0 || node.x >= this.width) {
				node.vx *= -1;
				node.x = clamp(node.x, 0, this.width);
			}
			if (node.y <= 0 || node.y >= this.height) {
				node.vy *= -1;
				node.y = clamp(node.y, 0, this.height);
			}

			if (this.pointer.active) {
				var dx = pointerX - node.x;
				var dy = pointerY - node.y;
				var distSq = dx * dx + dy * dy;
				if (distSq < 42000) {
					var pull = 0.0028;
					node.vx += dx * pull * 0.015;
					node.vy += dy * pull * 0.015;
					node.vx = clamp(node.vx, -0.25, 0.25);
					node.vy = clamp(node.vy, -0.25, 0.25);
				}
			}

			var drift = Math.sin(t * 0.0004 + node.pulseSeed) * 0.02;
			node.vx = clamp(node.vx + drift * 0.0006, -0.24, 0.24);
			node.vy = clamp(node.vy - drift * 0.0005, -0.24, 0.24);
		}
	};

	NeuralSectionEffect.prototype.draw = function (t) {
		if (!this.ctx) {
			return;
		}

		this.updatePulses(t);
		this.updateNodes(t);

		var ctx = this.ctx;
		var preset = getModePreset();
		ctx.clearRect(0, 0, this.width, this.height);
		ctx.globalCompositeOperation = "screen";

		var centerGlow = ctx.createRadialGradient(
			this.width * 0.5,
			this.height * 0.5,
			0,
			this.width * 0.5,
			this.height * 0.5,
			Math.max(this.width, this.height) * 0.72
		);
		centerGlow.addColorStop(0, "rgba(" + this.theme.glowColor + ", " + (0.2 * preset.glow).toFixed(3) + ")");
		centerGlow.addColorStop(0.55, "rgba(" + this.theme.glowColor + ", " + (0.08 * preset.glow).toFixed(3) + ")");
		centerGlow.addColorStop(1, "rgba(" + this.theme.glowColor + ", 0)");
		ctx.fillStyle = centerGlow;
		ctx.fillRect(0, 0, this.width, this.height);

		this.drawPulses(t);

		var maxDist = clamp(this.width * 0.17, 90, 190);
		for (var i = 0; i < this.nodes.length; i += 1) {
			for (var j = i + 1; j < this.nodes.length; j += 1) {
				var a = this.nodes[i];
				var b = this.nodes[j];
				var dx = b.x - a.x;
				var dy = b.y - a.y;
				var dist = Math.sqrt(dx * dx + dy * dy);
				if (dist > maxDist) {
					continue;
				}

				var alpha = (1 - dist / maxDist) * 0.34;
				var flow = (Math.sin(t * 0.002 + (a.pulseSeed + b.pulseSeed) * 1.7) + 1) * 0.5;
				var lineMidX = (a.x + b.x) * 0.5;
				var lineMidY = (a.y + b.y) * 0.5;
				var pulseBoost = this.getPulseBoost(lineMidX, lineMidY, t);
				ctx.strokeStyle = "rgba(" + this.theme.lineColor + ", " + (alpha * (0.65 + flow * 0.55 + pulseBoost * 0.65) * preset.line).toFixed(3) + ")";
				ctx.lineWidth = 0.8 * preset.line + pulseBoost * 0.55;
				ctx.beginPath();
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
			}
		}

		for (var k = 0; k < this.nodes.length; k += 1) {
			var node = this.nodes[k];
			var pulse = (Math.sin(t * 0.0024 + node.pulseSeed) + 1) * 0.5;
			var pulseBoost = this.getPulseBoost(node.x, node.y, t);
			var radius = node.radius + pulse * 0.9;
			ctx.fillStyle = node.color;
			ctx.globalAlpha = (0.48 + pulse * 0.35 + pulseBoost * 0.25) * preset.node;
			ctx.beginPath();
			ctx.arc(node.x, node.y, radius + pulseBoost * 1.8, 0, Math.PI * 2);
			ctx.fill();

			ctx.globalAlpha = (0.3 + pulseBoost * 0.15) * preset.node;
			ctx.beginPath();
			ctx.arc(node.x, node.y, radius * (2.1 + pulseBoost * 0.7), 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalCompositeOperation = "source-over";
		ctx.globalAlpha = 1;
	};

	NeuralSectionEffect.prototype.drawStatic = function () {
		if (!this.ctx) {
			return;
		}

		this.ctx.clearRect(0, 0, this.width, this.height);
		this.draw(Date.now());
	};

	NeuralSectionEffect.prototype.applyModeChange = function () {
		this.pulses = [];
		this.buildNodes();
	};

	function createModeToggle(onChange) {
		var button = document.createElement("button");
		button.type = "button";
		button.className = "neural-fx-toggle";
		button.setAttribute("aria-keyshortcuts", "Shift+F");

		function cycleMode() {
			var modes = allowedModes();
			var idx = modes.indexOf(fxState.mode);
			var nextIdx = idx >= 0 ? (idx + 1) % modes.length : 0;
			fxState.mode = modes[nextIdx];
			window.localStorage.setItem(MODE_STORAGE_KEY, fxState.mode);
			renderButtonState();
			onChange();
		}

		function updateAccessibilityLabel() {
			var modeName = isGreekLanguage() ? (fxState.mode === "soft" ? "ηπιο" : fxState.mode === "ultra" ? "ultra" : "εντονο") : fxState.mode;
			button.setAttribute(
				"aria-label",
				isGreekLanguage() ? "Αλλαγη εντασης εφε φοντου, τρεχον mode " + modeName : "Toggle background effect intensity, current mode " + modeName
			);
			button.title = isGreekLanguage()
				? "Αλλαγη εντασης εφε (Shift+F)"
				: "Change effect intensity (Shift+F)";
		}

		function renderButtonState() {
			fxState.mode = normalizeMode(fxState.mode);
			var preset = getModePreset();
			button.textContent = isGreekLanguage() ? preset.labelEl : preset.labelEn;
			button.classList.toggle("is-soft", fxState.mode === "soft");
			button.classList.toggle("is-ultra", fxState.mode === "ultra");
			updateAccessibilityLabel();
		}

		button.addEventListener("click", function () {
			cycleMode();
		});

		renderButtonState();
		document.body.appendChild(button);

		if ("MutationObserver" in window) {
			var langObserver = new MutationObserver(function () {
				renderButtonState();
			});
			langObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["lang"]
			});
		}

		window.addEventListener("resize", function () {
			var previous = fxState.mode;
			renderButtonState();
			if (previous !== fxState.mode) {
				window.localStorage.setItem(MODE_STORAGE_KEY, fxState.mode);
				onChange();
			}
		});

		document.addEventListener("keydown", function (event) {
			if (!(event.shiftKey && (event.key === "F" || event.key === "f"))) {
				return;
			}

			var target = event.target;
			if (!target) {
				return;
			}

			var tagName = (target.tagName || "").toLowerCase();
			var isTypingField =
				tagName === "input" ||
				tagName === "textarea" ||
				tagName === "select" ||
				target.isContentEditable;

			if (isTypingField) {
				return;
			}

			event.preventDefault();
			cycleMode();
		});
	}

	document.addEventListener("DOMContentLoaded", function () {
		fxState.mode = normalizeMode(fxState.mode);
		window.localStorage.setItem(MODE_STORAGE_KEY, fxState.mode);

		var sections = Array.prototype.slice.call(document.querySelectorAll(".section-dark"));
		if (!sections.length) {
			return;
		}

		var effects = [];
		for (var i = 0; i < sections.length; i += 1) {
			var effect = new NeuralSectionEffect(sections[i]);
			if (effect.ctx) {
				effects.push(effect);
			}
		}

		if (!effects.length) {
			return;
		}

		createModeToggle(function () {
			for (var m = 0; m < effects.length; m += 1) {
				effects[m].applyModeChange();
			}
		});

		var observer = null;
		if ("IntersectionObserver" in window) {
			observer = new IntersectionObserver(
				function (entries) {
					for (var e = 0; e < entries.length; e += 1) {
						var entry = entries[e];
						for (var x = 0; x < effects.length; x += 1) {
							if (effects[x].section === entry.target) {
								effects[x].isVisible = entry.isIntersecting;
								break;
							}
						}
					}
				},
				{ threshold: 0.05 }
			);

			for (var o = 0; o < effects.length; o += 1) {
				observer.observe(effects[o].section);
			}
		}

		var resizeTimer = null;
		window.addEventListener("resize", function () {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(function () {
				for (var r = 0; r < effects.length; r += 1) {
					effects[r].resize();
				}
			}, 120);
		});

		if (prefersReducedMotion) {
			for (var s = 0; s < effects.length; s += 1) {
				effects[s].drawStatic();
			}
			return;
		}

		function frame(time) {
			for (var f = 0; f < effects.length; f += 1) {
				if (effects[f].isVisible) {
					effects[f].draw(time);
				}
			}
			window.requestAnimationFrame(frame);
		}

		window.requestAnimationFrame(frame);
	});
})();
