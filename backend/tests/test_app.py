import json
import unittest
from unittest.mock import patch

from backend.app import analyze_similarity, app


class SimilarityTests(unittest.TestCase):
    def test_identical_texts_score_one_hundred_and_report_phrase(self):
        text = "Academic writing should preserve meaning and cite every source."

        result = analyze_similarity(text, text)

        self.assertEqual(result["score"], 100)
        self.assertTrue(result["matches"])
        self.assertIn("does not search the web", result["analysis"])

    def test_comparison_score_is_symmetric_and_unrelated_text_scores_zero(self):
        first = "The quick brown fox jumps over the lazy dog."
        second = "The quick brown fox runs over a dog."

        forward = analyze_similarity(first, second)["score"]
        reverse = analyze_similarity(second, first)["score"]
        unrelated = analyze_similarity("apple orange banana", "quantum mechanics")["score"]

        self.assertEqual(forward, reverse)
        self.assertLess(forward, 100)
        self.assertEqual(unrelated, 0)

    def test_empty_normalized_text_is_handled(self):
        result = analyze_similarity("!!!", "???")

        self.assertEqual(result["score"], 0)
        self.assertEqual(result["matches"], [])


class ApiTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_health_reports_local_comparison_available(self):
        response = self.client.get("/", headers={"Origin": "http://localhost:8000"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["features"]["text_comparison"])
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:8000",
        )

    def test_paraphrase_rejects_missing_text(self):
        response = self.client.post("/api/paraphrase", json={"text": "  "})

        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.get_json()["error"])

    def test_paraphrase_reports_missing_gemini_key_without_fake_success(self):
        with patch("backend.app.GEMINI_API_KEY", ""):
            response = self.client.post(
                "/api/paraphrase", json={"text": "A meaningful source sentence."}
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["code"], "gemini_not_configured")
        self.assertNotIn("paraphrased", response.get_json())

    def test_paraphrase_returns_gemini_generated_text(self):
        gemini_response = {
            "candidates": [{
                "content": {"parts": [{"text": "A rewritten sentence."}]}
            }]
        }
        with (
            patch("backend.app.GEMINI_API_KEY", "test-key"),
            patch("backend.app.urlopen") as urlopen,
        ):
            response_context = urlopen.return_value.__enter__.return_value
            response_context.read.return_value = json.dumps(gemini_response).encode()
            response = self.client.post(
                "/api/paraphrase", json={"text": "An original sentence."}
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["paraphrased"], "A rewritten sentence.")
        self.assertTrue(response.get_json()["success"])

    def test_similarity_endpoint_validates_and_returns_analysis(self):
        response = self.client.post(
            "/api/check-plagiarism",
            json={
                "original": "A shared academic sentence helps compare these two texts.",
                "comparison": "A shared academic sentence helps compare the texts.",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.get_json()["score"], 0)
        self.assertEqual(
            response.get_json()["method"],
            "normalized_word_and_sequence_similarity",
        )

    def test_invalid_json_is_reported_as_a_client_error(self):
        response = self.client.post(
            "/api/check-plagiarism",
            data="{not-json",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
