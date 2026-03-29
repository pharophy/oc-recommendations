import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/site-enhancements.inline"

const SiteEnhancements: QuartzComponent = (_props: QuartzComponentProps) => null

SiteEnhancements.afterDOMLoaded = script

export default (() => SiteEnhancements) satisfies QuartzComponentConstructor
