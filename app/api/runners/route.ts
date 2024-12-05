import { NextRequest } from 'next/server';
import { APIUtils } from '@/utils';

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const API_KEY = '9bb1f09993msh386164da7bb587bp19d6abjsn558acd106647'; // Replace with your Judge0 API key

const languageIdMap = {
    C: 50,
    'C++': 54,
    Python: 71, // Judge0 uses Python 3 for this ID
    Java: 62,
    JavaScript: 63,
    PHP: 55,
    Go: 36,
    Swift: 43,
    Ruby: 72,
    Rust: 40,
};

// Main POST function to handle the code execution request
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { code, language, stdin } = body;

    if (!code || !language) {
        return APIUtils.createNextResponse({ success: false, status: 400, message: 'Code and language are required' });
    }

    // Get the language ID using the languageIdMap
    const languageId = languageIdMap[language];

    if (!languageId) {
        return APIUtils.createNextResponse({
            success: false,
            status: 400,
            message: 'Unsupported language',
        });
    }

    // Prepare the request body for Judge0 submission
    const submissionData = {
        source_code: code,
        language_id: languageId,
        stdin: stdin || '', // Provide stdin if it's passed, else default to empty
        base64_encoded: false,
        wait: true, // We want to wait for the result before returning
    };

    // Send the request to Judge0 to create a submission
    try {
        const response = await fetch(JUDGE0_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'x-rapidapi-key': API_KEY,
            },
            body: JSON.stringify(submissionData),
        });

        const data = await response.json();

        // Check if submission was successful
        if (data.token) {
            // Poll for submission result
            const result = await pollSubmissionResult(data.token);

            // Create a formatted response
            const responsePayload = {
                stdout: result.stdout,
                stderr: result.stderr,
                timeTaken: result.time,
                success: result.status && result.status.id === 3,
            };

            return APIUtils.createNextResponse({ success: true, status: 200, payload: responsePayload });
        } else {
            console.log(data);
            return APIUtils.createNextResponse({
                success: false,
                status: 500,
                message: 'Failed to create submission',
            });
        }
    } catch (error) {
        APIUtils.logError(error);
        return APIUtils.createNextResponse({ success: false, status: 500, message: error.message });
    }
}

// Helper function to poll Judge0 for submission result
async function pollSubmissionResult(token: string) {
    const MAX_POLL_ATTEMPTS = 5;
    const POLL_INTERVAL = 2000; // 2 seconds between polls

    let attempts = 0;
    let result = null;

    while (attempts < MAX_POLL_ATTEMPTS) {
        try {
            const response = await fetch(`${JUDGE0_API_URL}/${token}?base64_encoded=false`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': API_KEY,
                },
            });

            result = await response.json();

            // If the result is available (status is not 'processing')
            if (![1, 2].includes(result.status?.id)) {
                return result; // Return the final result
            }
        } catch (error) {
            console.error('Error while polling Judge0:', error);
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }

    throw new Error('Polling timed out. Could not get result from Judge0.');
}
