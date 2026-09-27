import os
import sys
import random
import hashlib
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, Brand, Website, Keyword, RankingResult, RankingChange,
    RankCheckJob, Alert, SchedulerSetting
)
from app.services.ranking_engine import calculate_ranking_change, generate_ranking_alerts
from app.services.report_service import create_weekly_report


def seed():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping full reseeding (or cleaning)...")
            return

        print("Seeding Users...")
        users = [
            User(name="Alex Morgan (Admin)", email="admin@aventionseo.com", password_hash=get_password_hash("admin123"), role="admin"),
            User(name="Sarah Connor (Manager)", email="manager@aventionseo.com", password_hash=get_password_hash("manager123"), role="manager"),
            User(name="David Chen (SEO Specialist)", email="member@aventionseo.com", password_hash=get_password_hash("member123"), role="seo_member"),
            User(name="Elena Rostova (Stakeholder)", email="viewer@aventionseo.com", password_hash=get_password_hash("viewer123"), role="viewer"),
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Brands...")
        brands_data = [
            Brand(name="TargetNXT", slug="targetnxt", description="TargetNXT - B2B Marketing Intelligence & Data Solutions. Verified B2B email lists, technology users lists, healthcare databases, and custom data enrichment.", status="active"),
            Brand(name="Enterprise Cloud ERP", slug="enterprise-cloud-erp", description="Leading B2B cloud enterprise resource planning suite.", status="active"),
            Brand(name="Fintech Horizons", slug="fintech-horizons", description="Next-gen digital banking, algorithmic trading & payments platform.", status="active"),
            Brand(name="Avention Digital", slug="avention-digital", description="Global digital marketing and enterprise growth consultancy.", status="active"),
            Brand(name="HealthCare Plus", slug="healthcare-plus", description="Telemedicine, hospital management systems & clinic networks.", status="active"),
        ]
        db.add_all(brands_data)
        db.commit()

        print("Seeding Websites...")
        b0, b1, b2, b3, b4 = brands_data[0].id, brands_data[1].id, brands_data[2].id, brands_data[3].id, brands_data[4].id
        websites_data = [
            Website(brand_id=b0, domain="www.targetnxt.com", name="TargetNXT", country="United States", status="active"),
            Website(brand_id=b1, domain="sapconsulting.com", name="SAP Enterprise Solutions", country="United States", status="active"),
            Website(brand_id=b1, domain="cloudtechsuite.io", name="Cloud Tech Suite ERP", country="United Kingdom", status="active"),
            Website(brand_id=b2, domain="finvesta.ai", name="Finvesta AI Payments", country="Singapore", status="active"),
            Website(brand_id=b2, domain="paynexglobal.com", name="PayNex Global Transfers", country="United States", status="active"),
            Website(brand_id=b3, domain="avention.io", name="Avention Digital Agency", country="India", status="active"),
            Website(brand_id=b3, domain="growthseo.agency", name="GrowthSEO Performance", country="Australia", status="active"),
            Website(brand_id=b4, domain="medilinkhealth.org", name="MediLink Health Systems", country="Canada", status="active"),
            Website(brand_id=b4, domain="careplusclinics.com", name="CarePlus Telehealth", country="United States", status="active"),
        ]
        db.add_all(websites_data)
        db.commit()

        print("Seeding 100+ Realistic SEO Keywords...")
        locations = ["New York", "London", "Hyderabad", "Bangalore", "Mumbai", "San Francisco", "Sydney", "Toronto", "Singapore", "Berlin"]
        countries = ["United States", "United Kingdom", "India", "India", "India", "United States", "Australia", "Canada", "Singapore", "Germany"]

        raw_keywords = [
            # Website 0: www.targetnxt.com (20 keywords)
            (0, "b2b email list provider", "/b2b-email-list/"),
            (0, "technology users list", "/technology-users-list/"),
            (0, "sap users email list", "/technology-users-list/sap-users-email-list/"),
            (0, "salesforce customers database", "/technology-users-list/salesforce-users-list/"),
            (0, "manufacturing industry email list", "/industry-email-list/manufacturing-email-list/"),
            (0, "healthcare email list", "/healthcare-email-list/"),
            (0, "construction companies email list", "/industry-email-list/construction-companies-email-list/"),
            (0, "banking finance companies email list", "/industry-email-list/banking-finance-companies-email-list/"),
            (0, "real estate companies email list", "/industry-email-list/real-estate-companies-email-list/"),
            (0, "automotive companies email list", "/industry-email-list/automotive-companies-email-list/"),
            (0, "chemical companies email list", "/industry-email-list/chemical-companies-email-list/"),
            (0, "retail companies email list", "/industry-email-list/retail-companies-email-list/"),
            (0, "oil and gas companies email list", "/industry-email-list/oil-gas-companies-email-list/"),
            (0, "data appending services", "/data-appending-services/"),
            (0, "email appending services", "/email-appending-services/"),
            (0, "b2b marketing intelligence", "/"),
            (0, "c-level executives email list", "/b2b-email-list/c-level-executives-email-list/"),
            (0, "hospital decision makers email database", "/healthcare-email-list/"),
            (0, "verified business contact list", "/b2b-email-list/"),
            (0, "b2b lead generation data solutions", "/"),
            (0, "SAP S4 HANA migration partner", "/solutions/sap-s4-hana"),
            (0, "enterprise ERP implementation", "/solutions/erp-implementation"),
            (0, "SAP business one pricing", "/pricing/sap-business-one"),
            (0, "SAP cloud integration architecture", "/technology/sap-cloud-integration"),
            (0, "best SAP consultants for manufacturing", "/industries/manufacturing"),
            (0, "SAP supply chain management software", "/solutions/scm-sap"),
            (0, "SAP Fiori custom app development", "/solutions/sap-fiori"),
            (0, "SAP successfactors HR automation", "/solutions/sap-successfactors"),
            (0, "SAP analytics cloud dashboard", "/solutions/sap-analytics-cloud"),
            (0, "hire certified SAP architects", "/services/hire-sap-architects"),
            (0, "SAP Ariba procurement consulting", "/solutions/sap-ariba"),
            (0, "SAP BW on HANA support", "/support/sap-bw-hana"),
            (0, "enterprise cloud ERP roadmap", "/insights/enterprise-cloud-roadmap"),
            (0, "SAP managed services SLA", "/services/managed-services"),

            # Website 2: cloudtechsuite.io (13 keywords)
            (1, "cloud ERP software for tech startups", "/products/startup-erp"),
            (1, "multi-tenant SaaS accounting platform", "/features/accounting"),
            (1, "automated payroll cloud software", "/features/payroll"),
            (1, "cloud inventory management system", "/features/inventory"),
            (1, "open API ERP system for developers", "/developers/api"),
            (1, "SOC2 compliant cloud ERP", "/security/soc2-compliance"),
            (1, "automated invoice reconciliation AI", "/features/invoice-ai"),
            (1, "hybrid cloud ERP deployment", "/architecture/hybrid-cloud"),
            (1, "B2B financial operations software", "/products/finops"),
            (1, "subscription billing and revenue recognition", "/features/rev-rec"),
            (1, "ERP automated purchase order workflow", "/features/po-workflow"),
            (1, "enterprise resource planning demo", "/demo"),
            (1, "cloud ERP vs on-premise cost comparison", "/blog/cloud-vs-onprem"),

            # Website 3: finvesta.ai (12 keywords)
            (2, "AI automated algorithmic trading platform", "/solutions/algo-trading"),
            (2, "crypto liquidity provider API", "/api/crypto-liquidity"),
            (2, "cross border payment orchestration engine", "/payments/orchestration"),
            (2, "instant SEPA and SWIFT rails", "/network/swift-sepa"),
            (2, "embedded finance SDK for fintechs", "/products/embedded-finance"),
            (2, "AML compliance automated screening", "/compliance/aml-screening"),
            (2, "fraud detection machine learning finance", "/security/fraud-detection"),
            (2, "corporate treasury automation software", "/treasury"),
            (2, "merchant payment gateway low fees", "/merchant/gateway"),
            (2, "FX hedging algorithm for businesses", "/solutions/fx-hedging"),
            (2, "digital banking infrastructure API", "/developers/banking-api"),
            (2, "stablecoin settlement for cross border", "/solutions/settlement"),

            # Website 4: paynexglobal.com (12 keywords)
            (3, "low fee international wire transfer", "/transfers/international"),
            (3, "global payroll payout API", "/api/payroll-payouts"),
            (3, "virtual IBAN multi currency accounts", "/products/virtual-iban"),
            (3, "send money to India business rates", "/routes/usd-to-inr"),
            (3, "B2B payment rail latency", "/technology/payment-rails"),
            (3, "global freelancer payment platform", "/products/freelancer-payouts"),
            (3, "ecommerce checkout currency converter", "/plugins/currency-converter"),
            (3, "ACH payments automated processing", "/features/ach-processing"),
            (3, "SEPA instant credit transfer API", "/europe/sepa-instant"),
            (3, "mass payouts corporate dashboard", "/business/mass-payouts"),
            (3, "secure SWIFT GPI payment tracking", "/security/swift-gpi"),
            (3, "commercial remittance services", "/enterprise/remittance"),

            # Website 5: avention.io (14 keywords)
            (4, "B2B SaaS SEO agency", "/services/saas-seo"),
            (4, "enterprise SEO automation platform", "/platform/seo-automation"),
            (4, "technical SEO audit for enterprise", "/services/technical-seo-audit"),
            (4, "programmatic SEO consulting", "/services/programmatic-seo"),
            (4, "high intent keyword research framework", "/insights/keyword-framework"),
            (4, "Google search ranking recovery services", "/services/penalty-recovery"),
            (4, "conversion rate optimization for SaaS", "/services/cro"),
            (4, "content strategy for B2B tech", "/services/content-strategy"),
            (4, "digital PR link building agency", "/services/digital-pr"),
            (4, "Core Web Vitals optimization consulting", "/services/core-web-vitals"),
            (4, "international multilingual SEO strategy", "/services/international-seo"),
            (4, "enterprise SEO ROI attribution", "/insights/seo-roi"),
            (4, "SERP volatility tracker tool", "/tools/serp-volatility"),
            (4, "AI search overview optimization agency", "/services/ai-search-optimization"),

            # Website 6: growthseo.agency (12 keywords)
            (5, "ecommerce SEO growth agency", "/ecommerce-seo"),
            (5, "Shopify Plus SEO specialists", "/shopify-plus-seo"),
            (5, "local SEO rank tracking software", "/tools/local-rank-tracker"),
            (5, "SaaS organic pipeline generation", "/case-studies/saas-pipeline"),
            (5, "fractional VP of SEO services", "/fractional-seo-leadership"),
            (5, "enterprise backlink building service", "/link-building"),
            (5, "SEO migration checklist headless CMS", "/blog/headless-migration"),
            (5, "rank tracking API for marketing teams", "/api/rank-tracking"),
            (5, "B2B product marketing SEO alignment", "/insights/product-marketing-seo"),
            (5, "competitor organic keyword gap analysis", "/services/keyword-gap"),
            (5, "schema markup automation consultant", "/services/schema-automation"),
            (5, "SEO dashboard for executives", "/platform/executive-reporting"),

            # Website 7: medilinkhealth.org (11 keywords)
            (6, "HIPAA compliant electronic health records cloud", "/products/ehr-cloud"),
            (6, "hospital management system software", "/solutions/hospital-management"),
            (6, "telehealth API video consultation", "/technology/telehealth-api"),
            (6, "patient portal mobile app healthcare", "/solutions/patient-portal"),
            (6, "medical billing revenue cycle management", "/services/rcm"),
            (6, "clinical decision support system AI", "/ai/clinical-decision"),
            (6, "electronic prescribing EPCS certified", "/features/epcs"),
            (6, "radiology PACS cloud imaging", "/solutions/pacs-imaging"),
            (6, "ambulatory care clinic software", "/solutions/ambulatory"),
            (6, "healthcare interoperability FHIR standards", "/developers/fhir"),
            (6, "lab information management system LIMS", "/products/lims"),

            # Website 8: careplusclinics.com (11 keywords)
            (7, "online doctor consultation 24/7", "/online-consult"),
            (7, "urgent care walk in clinic near me", "/locations/urgent-care"),
            (7, "telehealth prescription refill online", "/services/prescription-refill"),
            (7, "mental health therapy virtual sessions", "/services/tele-psychiatry"),
            (7, "primary care physician appointment booking", "/physicians/booking"),
            (7, "virtual pediatric care online doctor", "/services/pediatrics"),
            (7, "chronic disease management remote monitoring", "/programs/remote-monitoring"),
            (7, "corporate wellness telemedicine benefits", "/employer/wellness"),
            (7, "dermatology online photo consultation", "/services/dermatology"),
            (7, "affordable urgent care without insurance", "/pricing/self-pay"),
            (7, "women telehealth wellness clinic", "/services/womens-health"),
        ]

        keywords_objs = []
        for i, (site_idx, kw_text, lp) in enumerate(raw_keywords):
            target_site = websites_data[site_idx]
            loc_idx = i % len(locations)
            loc = locations[loc_idx]
            country = countries[loc_idx]
            dev = "desktop" if (i % 3 != 0) else "mobile"

            kw = Keyword(
                website_id=target_site.id,
                keyword=kw_text,
                landing_page_url=lp,
                location=loc,
                country=country,
                language="en",
                device=dev,
                search_engine="google",
                target_url=f"https://{target_site.domain}{lp}",
                status="active"
            )
            keywords_objs.append(kw)

        db.add_all(keywords_objs)
        db.commit()

        print(f"Total Keywords seeded: {len(keywords_objs)}. Generating 90 days ranking history...")

        # Generate 90 days history (simulate 1 check per week or every few days)
        # 90 days back to today
        now = datetime.now(timezone.utc)
        check_points = []
        for d in range(90, 0, -5):  # every 5 days for 90 days
            check_points.append(now - timedelta(days=d))
        check_points.append(now)

        all_results = []
        all_changes = []
        all_alerts = []

        for kw in keywords_objs:
            # Deterministic baseline position based on kw text
            seed_val = int(hashlib.md5(kw.keyword.encode("utf-8")).hexdigest()[:6], 16)
            base_pos = (seed_val % 38) + 1  # 1 to 38
            curr_pos = base_pos

            prev_pos = None

            for pt in check_points:
                # Random walk drift (-2 to +2)
                drift = random.choice([-2, -1, 0, 0, 1, 1, 2])
                curr_pos = max(1, min(100, curr_pos + drift))
                
                # 3% chance of dropping out of top 100 on older points
                is_unranked = (random.random() < 0.03)
                reported_pos = 101 if is_unranked else curr_pos

                res = RankingResult(
                    keyword_id=kw.id,
                    checked_at=pt,
                    position=reported_pos,
                    url_found=kw.target_url,
                    title=f"{kw.keyword.title()} | {kw.website.domain}",
                    snippet=f"Official guide and enterprise solutions for {kw.keyword}. Serving customers in {kw.location}.",
                    search_engine=kw.search_engine,
                    location=kw.location,
                    device=kw.device,
                    status="success" if not is_unranked else "not_found"
                )
                all_results.append(res)

                # Changes
                diff, chg_type = calculate_ranking_change(prev_pos, reported_pos)
                chg = RankingChange(
                    keyword_id=kw.id,
                    previous_position=prev_pos,
                    current_position=reported_pos,
                    change=diff,
                    checked_at=pt,
                    change_type=chg_type
                )
                all_changes.append(chg)

                # Alerts on recent points (last 14 days)
                if pt >= (now - timedelta(days=14)):
                    alerts = generate_ranking_alerts(kw, prev_pos, reported_pos)
                    for a in alerts:
                        a.created_at = pt
                        all_alerts.append(a)

                prev_pos = reported_pos

        db.bulk_save_objects(all_results)
        db.bulk_save_objects(all_changes)
        db.bulk_save_objects(all_alerts)
        db.commit()

        print(f"Generated {len(all_results)} ranking results, {len(all_changes)} changes, {len(all_alerts)} alerts.")

        print("Seeding sample Rank Check Jobs...")
        job1 = RankCheckJob(
            website_id=websites_data[0].id,
            brand_id=b1,
            started_at=now - timedelta(days=5, hours=2),
            completed_at=now - timedelta(days=5, hours=1, minutes=58),
            total_keywords=15,
            processed_keywords=15,
            successful=15,
            failed=0,
            status="completed",
            created_at=now - timedelta(days=5, hours=2)
        )
        job2 = RankCheckJob(
            website_id=None,
            brand_id=None,
            started_at=now - timedelta(hours=3),
            completed_at=now - timedelta(hours=2, minutes=55),
            total_keywords=len(keywords_objs),
            processed_keywords=len(keywords_objs),
            successful=len(keywords_objs),
            failed=0,
            status="completed",
            created_at=now - timedelta(hours=3)
        )
        db.add_all([job1, job2])
        db.commit()

        print("Seeding Scheduler Setting...")
        sched = SchedulerSetting(
            day_of_week="mon",
            time_str="06:00",
            timezone="Asia/Kolkata",
            frequency="weekly",
            is_active=True,
            updated_at=now
        )
        db.add(sched)
        db.commit()

        print("Generating initial PDF Reports...")
        try:
            create_weekly_report(db, brand_id=None)
            create_weekly_report(db, brand_id=b1)
            create_weekly_report(db, brand_id=b3)
            print("Reports and PDF files generated successfully!")
        except Exception as e:
            print(f"Notice: PDF generation in seed encountered: {e}")

        print("SUCCESS: Realistic SEO database seeded successfully with 4 brands, 8 websites, 100 keywords, and 90 days ranking history!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
