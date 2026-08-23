from fastapi.testclient import TestClient


def test_demo_portfolio_analytics_and_scenario(client: TestClient) -> None:
    demo = client.post("/api/v1/portfolios/demo")
    assert demo.status_code == 200
    portfolio_id = demo.json()["id"]

    portfolio = client.get(f"/api/v1/portfolios/{portfolio_id}")
    assert portfolio.status_code == 200
    assert len(portfolio.json()["positions"]) == 21

    analytics = client.get(f"/api/v1/portfolios/{portfolio_id}/analytics")
    assert analytics.status_code == 200
    body = analytics.json()
    assert float(body["portfolio_value"]) > 0
    assert float(body["gain_loss"]["total_cost_basis"]) > 0
    assert body["gain_loss"]["unrealized_gain_loss_percent"] is not None
    assert float(body["gain_loss"]["coverage_percent"]) > 0
    assert len(body["gain_loss_contributors"]) > 0
    assert body["top_positions"][0]["unrealized_gain_loss"] is not None
    assert float(body["weighted_yield"]["coverage_percent"]) > 0
    assert body["weighted_duration"]["value"] is not None
    assert len(body["maturity_distribution"]) == 5

    scenario = client.post(
        f"/api/v1/portfolios/{portfolio_id}/scenarios/interest-rate",
        json={"shock_bps": 100},
    )
    assert scenario.status_code == 200
    scenario_body = scenario.json()
    assert float(scenario_body["estimated_change"]) < 0
    assert float(scenario_body["coverage_percent"]) > 0
    assert len(scenario_body["largest_impacts"]) <= 5


def test_search_and_add_position(client: TestClient) -> None:
    created = client.post("/api/v1/portfolios", json={"name": "Test Portfolio"})
    portfolio_id = created.json()["id"]

    search = client.get("/api/v1/bonds/search?q=HDFC")
    assert search.status_code == 200
    result = search.json()[0]
    assert result["isin"].startswith("INE")

    added = client.post(
        f"/api/v1/portfolios/{portfolio_id}/positions",
        json={"isin": result["isin"], "quantity": 10, "purchase_price": 1000},
    )
    assert added.status_code == 201
    assert float(added.json()["market_value"]) > 0

    duplicate = client.post(
        f"/api/v1/portfolios/{portfolio_id}/positions",
        json={"isin": result["isin"], "quantity": 2},
    )
    assert duplicate.status_code == 409


def test_update_portfolio_name(client: TestClient) -> None:
    created = client.post("/api/v1/portfolios", json={"name": "Original Portfolio"})
    assert created.status_code == 201
    portfolio_id = created.json()["id"]

    renamed = client.put(f"/api/v1/portfolios/{portfolio_id}", json={"name": "Core Bond Book"})
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Core Bond Book"

    fetched = client.get(f"/api/v1/portfolios/{portfolio_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Core Bond Book"


def test_bond_suggestions_before_search(client: TestClient) -> None:
    response = client.get("/api/v1/bonds/suggestions")
    assert response.status_code == 200
    body = response.json()
    assert len(body) >= 5
    assert all(item["isin"].startswith("INE") for item in body)
    assert {item["provider_name"] for item in body} == {"DemoBondDataProvider"}


def test_csv_import_partial_validation(client: TestClient) -> None:
    created = client.post("/api/v1/portfolios", json={"name": "CSV Portfolio"})
    portfolio_id = created.json()["id"]
    csv = (
        "isin,issuer,security_name,coupon_rate,maturity_date,face_value,quantity,"
        "purchase_price,current_price,duration,rating,sector\n"
        "INE999A08011,Example Issuer,Example Bond,7.5,2031-08-15,1000,25,1000,1005,4.2,AA,Other\n"
        "BADISIN,Example Issuer,Bad Bond,7.5,2031-08-15,1000,25,1000,1005,4.2,AA,Other\n"
    )
    response = client.post(
        f"/api/v1/portfolios/{portfolio_id}/import",
        files={"file": ("positions.csv", csv, "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["imported_rows"] == 1
    assert body["invalid_rows"] == 1
    assert body["errors"][0]["field"] == "isin"
