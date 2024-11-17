// https://www.figma.com/plugin-docs/manifest/
export default {
  name: "figma-components-extractor",
  id: "1222852692367737510",
  api: "1.0.0",
  main: "plugin.js",
  capabilities: ["codegen"],
  codegenLanguages: [
    {
      label: "css object",
      value: "javascript",
    },
  ],
  enableProposedApi: false,
  documentAccess: "dynamic-page",
  editorType: ["dev"],
  networkAccess: {
    allowedDomains: ["none"],
  },
}
