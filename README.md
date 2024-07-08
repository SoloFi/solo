# Setup

## 1. Create AWS access keys by following the instructions [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user_manage_add-key.html).

### Loading access keys from a file

You can keep your AWS credentials in a file. The credentials are found at:

- `~/.aws/credentials` on Linux, Unix, and macOS;
- `C:\Users\USER_NAME\.aws\credentials` on Windows

If the credentials file does not exist on your machine, create it. The file should have the following format:

```plaintext
[default]
aws_access_key_id = <YOUR_ACCESS_KEY_ID>
aws_secret_access_key = <YOUR_SECRET_ACCESS_KEY>
```

### Loading from environment variables

SST automatically detects AWS credentials in your environment and uses them for making requests to AWS. The environment variables that you need to set are:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 2. Install the dependencies

### Using Bun

```bash
$ bun install
```

### Using NPM

```bash
$ npm install
```

## 3. Run the setup script

```bash
$ npm run setup
```
Copy the outputted `API_KEY` if you want to create a new user on the frontend.

## 4. Run the dev environment & deploy the stack

```bash
$ npm run dev
```

## 5. Create a new user

Navigate to `http://localhost:3000/signUp` and create a new user. Use the `API_KEY` from the setup script for the `Access key` field. You can also find this value in your `.env` file.
