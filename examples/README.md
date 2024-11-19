# WaveQuery Conductor Examples

This directory contains examples demonstrating various uses of the WaveQuery Conductor package.

## Basic Examples

### Text Analysis
Simple example showing how to use the basic features:
```bash
cd examples/basic
cp .env.example .env    # Copy and edit with your API keys
yarn install
yarn start
```
and you can run them like:
```bash
tsx file-name.ts
```

## Advanced Examples With Frameworks

### Complex Workflow
Demonstrates advanced features like custom tools and visualization:
```bash
cd examples/advanced
cp .env.example .env
yarn install
yarn start
```

## Running Examples

Each example is a standalone project that demonstrates specific features. To run any example:

1. Navigate to the example directory
2. Install dependencies: `yarn install`
3. Set up environment variables: Copy `.env.example` to `.env` and add your API keys
4. Run the example: `yarn start`