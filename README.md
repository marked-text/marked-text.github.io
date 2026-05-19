# marked-text.github.io

An extract from WCQ - A Web Components Course

## `<marked-text>`

`<marked-text>` is a lightweight web component that moves its authored content into shadow DOM, measures nested highlight targets, and paints a single SVG background layer that looks like hand-drawn marker ink behind inline text and block rectangles.

## Attributes

- `color`: default highlight fill color for all marked targets. Default: `#facc15`.
- `frequency`: default SVG turbulence `baseFrequency`. Default: `0.015`.
- `scale`: default SVG displacement scale. Default: `13`.
- `seed`: default SVG turbulence seed. Default: `0`.

Host-level defaults can also come from CSS custom properties: `--marked-text-color`, `--marked-text-frequency`, `--marked-text-scale`, and `--marked-text-seed`. Attributes win over CSS variables when both are present.

Marked targets inside the component can override those values for a single highlight by setting `color`, `frequency`, `scale`, or `seed` on `mark-text`, or by using either those same names or the `marktext*` aliases on `[marktext]` elements.

## Methods

- `scheduleRender()`: queues a redraw on the next animation frame.
- `render()`: remeasures marked targets and rebuilds the SVG highlight background.

## Marked Targets

- `mark-text`: highlights wrapped inline content, including multi-line spans.
- `[marktext]`: highlights the element box as a single rectangle.

## Example

```html
<marked-text style="--marked-text-scale: 18; --marked-text-seed: 2" color="rebeccapurple">
	Charlie Brown was not very good at <mark-text seed="8">flying kites</mark-text>.
	<p marktext color="goldenrod" scale="22">
		Sometimes I lie awake at night.
	</p>
</marked-text>
```
