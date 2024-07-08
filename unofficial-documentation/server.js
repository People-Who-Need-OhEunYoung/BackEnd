import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();

app.use(cors());

app.use(
  '/proxy',
  createProxyMiddleware({
    target: 'https://solved.ac/api/v3',
    changeOrigin: true,
    pathRewrite: {
      '^/proxy': '', // /proxy 경로를 타겟 경로로 매핑
    },
    onProxyRes: function (proxyRes, req, res) {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
  }),
);

const port = 8481;
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
