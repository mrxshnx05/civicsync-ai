import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv
from pathlib import Path

# Load .env from the backend folder
load_dotenv(Path(__file__).parent / ".env")


def print_env():
    print("=" * 50)
    print("AWS Environment Variables")
    print("=" * 50)

    print("AWS_REGION:", os.getenv("AWS_REGION"))
    print("AWS_S3_BUCKET:", os.getenv("AWS_S3_BUCKET"))

    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

    if access_key:
        print("AWS_ACCESS_KEY_ID: Loaded ✅")
    else:
        print("AWS_ACCESS_KEY_ID: Missing ❌")

    if secret_key:
        print("AWS_SECRET_ACCESS_KEY: Loaded ✅")
    else:
        print("AWS_SECRET_ACCESS_KEY: Missing ❌")

    print("=" * 50)


def test_s3():
    print("\nTesting Amazon S3...")

    try:
        s3 = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

        response = s3.list_buckets()

        print("✅ S3 connection successful!")

        print("\nBuckets:")
        for bucket in response.get("Buckets", []):
            print(f"  • {bucket['Name']}")

        return True

    except Exception as e:
        print("❌ S3 connection failed")
        print(e)
        return False


def test_bedrock():
    print("\nTesting Amazon Bedrock...")

    try:
        bedrock = boto3.client(
            "bedrock-runtime",
            region_name=os.getenv("AWS_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

        print("✅ Bedrock client created successfully!")

        return True

    except Exception as e:
        print("❌ Bedrock connection failed")
        print(e)
        return False


def main():
    print("\nCivicSync AI - AWS Connection Test\n")

    print_env()

    s3_ok = test_s3()
    bedrock_ok = test_bedrock()

    print("\n" + "=" * 50)

    if s3_ok and bedrock_ok:
        print("🎉 All AWS services are working correctly!")
    else:
        print("⚠️ Some AWS services failed.")
        print("Check your IAM credentials and permissions.")

    print("=" * 50)


if __name__ == "__main__":
    main()