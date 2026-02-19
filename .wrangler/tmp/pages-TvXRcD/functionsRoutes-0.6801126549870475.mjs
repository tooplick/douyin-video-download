import { onRequestGet as __api_download_js_onRequestGet } from "D:\\Github\\douyin-video-download\\functions\\api\\download.js"
import { onRequestGet as __api_parse_js_onRequestGet } from "D:\\Github\\douyin-video-download\\functions\\api\\parse.js"

export const routes = [
    {
      routePath: "/api/download",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_download_js_onRequestGet],
    },
  {
      routePath: "/api/parse",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_parse_js_onRequestGet],
    },
  ]