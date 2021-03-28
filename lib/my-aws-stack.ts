import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';


const VPC_NAME = process.env.AWS_VPC_NAME || 'MyVPC';
const EC2_NAME = process.env.AWS_EC2_NAME || 'MyEc2';
const DB_NAME = process.env.AWS_DB_NAME || 'MyDb';
const DB_USER = process.env.AWS_DB_USER || 'admin';

export class MyAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    // Create new VPC
    const vpc = new ec2.Vpc(this, VPC_NAME, { maxAzs: 2 });

    // Open port 22 for SSH connection from anywhere
    const myEc2SecurityGroup = new ec2.SecurityGroup(this, `${EC2_NAME}SecurityGroup`, {
      vpc,
      securityGroupName: `${EC2_NAME}-ec2-sg`.toLowerCase(),
      description: 'Allow access to the instance',
      allowAllOutbound: true
    });
    myEc2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')
    myEc2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow public web access')
    myEc2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'allow secure web access')

    const machineImage = new ec2.GenericLinuxImage({
      'ap-southeast-2': 'ami-0d767dd04ac152743'   // ubuntu-focal-20.04-amd64-server-20210129
    })

    // view logs at /var/log/cloud-init-output.log
    const userData = ec2.UserData.forLinux();
    // userData.addCommands('sudo apt update');
    userData.addCommands('sudo apt update');
    userData.addCommands('sudo apt install -y nginx', 'sudo service nginx start');
    userData.addCommands('sudo apt install -y mysql-client');
    userData.addCommands('sudo curl -sL https://deb.nodesource.com/setup_14.x | bash');
    userData.addCommands('sudo apt install nodejs');
    userData.addCommands('sudo curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"');
    userData.addCommands('sudo unzip awscliv2.zip');
    userData.addCommands('sudo ./aws/install');
    
    const ec2Instance = new ec2.Instance(this, `${EC2_NAME}Instance`, {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: machineImage,
      securityGroup: myEc2SecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, 

      userData: userData
    });

    const myDbSecurityGroup = new ec2.SecurityGroup(this, `${DB_NAME}SecurityGroup`, {
      vpc,
      securityGroupName: `${DB_NAME}-db-sg`.toLowerCase(),
      description: 'Open database for access',
      allowAllOutbound: true
    });

    myDbSecurityGroup.addIngressRule(myEc2SecurityGroup, ec2.Port.tcp(3306), 'allow access from ec2 instance')

    const dbInstance = new rds.DatabaseInstance(this, `${DB_NAME}Instance`, {
      databaseName: DB_NAME,
      engine: rds.DatabaseInstanceEngine.mysql({ version : rds.MysqlEngineVersion.VER_8_0_21 }),
      // optional, defaults to m5.large
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
      credentials: rds.Credentials.fromGeneratedSecret(DB_USER), // Optional - will default to 'admin' username and generated password
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE
      },
      securityGroups: [
        myDbSecurityGroup
      ]
    });
  }
}
