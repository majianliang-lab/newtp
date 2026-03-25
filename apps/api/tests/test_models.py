from app.models.asset import Asset


def test_asset_has_security_domain_fk():
    assert "security_domain_id" in Asset.__table__.columns
