#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MyAwsStack } from '../lib/my-aws-stack';

const ACCOUNT = process.env.AWS_ACCOUNT;
const REGION = process.env.AWS_REGION || 'ap-southeast-2';

const app = new cdk.App();
new MyAwsStack(app, 'MyAwsStack', {
  env: {
    region: REGION,
    account: ACCOUNT
  }
});
