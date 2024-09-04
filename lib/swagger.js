const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// YAML 파일 경로 지정
const swaggerPath = path.resolve(__dirname, '../swagger/swagger.yaml');
const swaggerDocument = YAML.load(swaggerPath);

module.exports = {
    swaggerUi,
    swaggerDocument
};