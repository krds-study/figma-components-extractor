/* eslint-disable @typescript-eslint/no-explicit-any */
import { diff as deepDiff } from "deep-diff"

const getAllNodeCSS = async (
  node: SceneNode
): Promise<{ name: string; type: string; css: { [key: string]: string }; children?: any[] }> => {
  const css = await node.getCSSAsync()
  if ("children" in node && node.children) {
    const childrenCss = await Promise.all(node.children.map(child => getAllNodeCSS(child)))
    childrenCss.forEach(child => {
      if (child?.type === "TEXT") {
        Object.assign(css, child.css)
      }
    })
    return {
      name: node.name,
      type: node.type,
      css,
      children: childrenCss,
    }
  }
  return {
    name: node.name,
    type: node.type,
    css,
  }
}
const getDiffStyles = (baseStyles: any, variantStyles: any) => {
  const differences = deepDiff(baseStyles, variantStyles)
  if (!differences) return {}

  const diffStyles: { [key: string]: string } = {}
  differences.forEach(difference => {
    if (difference.kind === "E" && difference.path) {
      diffStyles[difference.path[0]] = difference.rhs
    }
  })
  return diffStyles
}

figma.on("selectionchange", async () => {
  const selection = figma.currentPage.selection[0]
  const componentName = selection.name.toLowerCase()

  if (selection.type !== "COMPONENT_SET") {
    console.log("component set를 클릭해주세요")
    return
  }
  if (selection?.type === "COMPONENT_SET") {
    console.log(selection.name + "감지중")
    let cssOutput = ""
    const variants = selection.children as ComponentNode[]
    const baseVariant = variants[0] //제일 첫번째 child 컴포넌트를 base로
    const baseStyles = await getAllNodeCSS(baseVariant)

    // Base styles
    cssOutput += `
.${componentName} {
${Object.entries(baseStyles.css)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}
}
`
    // Base child styles
    baseStyles.children?.forEach(child => {
      const childName = child.name.toLowerCase()
      cssOutput += `
.${componentName}-${childName} {
${Object.entries(child.css)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}
}
`
    })

    // Variant styles (differences only)
    for (let i = 1; i < variants.length; i++) {
      const variant = variants[i]
      if (!variant.variantProperties) continue

      const variantStyles = await getAllNodeCSS(variant)
      const variantName = Object.entries(variant.variantProperties)
        .map(([key, value]) => `${key}-${value}`)
        .join("-")

      // Root variant differences
      const rootDiffs = getDiffStyles(baseStyles.css, variantStyles.css)
      if (Object.keys(rootDiffs).length > 0) {
        cssOutput += `
.${componentName}--${variantName.toLowerCase()} {
${Object.entries(rootDiffs)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}
}
`
      }

      // Child component differences
      variantStyles.children?.forEach((child, childIndex) => {
        const baseChild = baseStyles.children?.[childIndex]
        if (!baseChild) return

        const childName = child.name.toLowerCase()
        const childDiffs = getDiffStyles(baseChild.css, child.css)

        if (Object.keys(childDiffs).length > 0) {
          cssOutput += `
.${componentName}-${childName}--${variantName.toLowerCase()} {
${Object.entries(childDiffs)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}
}
`
        }
      })
    }
    console.log(cssOutput)
  }
})
