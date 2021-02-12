#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MyAwsStack } from '../lib/my-aws-stack';

const app = new cdk.App();
new MyAwsStack(app, 'MyAwsStack');
