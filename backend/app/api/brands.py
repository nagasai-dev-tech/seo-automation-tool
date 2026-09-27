from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Brand, Website, Keyword, User
from app.schemas.schemas import BrandCreate, BrandUpdate, BrandOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("", response_model=List[BrandOut])
def list_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    brands = db.query(Brand).order_by(Brand.name.asc()).all()
    result = []
    for b in brands:
        w_count = db.query(Website).filter(Website.brand_id == b.id).count()
        kw_count = (
            db.query(Keyword)
            .join(Website)
            .filter(Website.brand_id == b.id)
            .count()
        )
        b_dict = {
            "id": b.id,
            "name": b.name,
            "slug": b.slug,
            "description": b.description,
            "logo_url": b.logo_url,
            "status": b.status,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "website_count": w_count,
            "keyword_count": kw_count
        }
        result.append(b_dict)
    return result


@router.post("", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
def create_brand(
    brand_in: BrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    existing = db.query(Brand).filter(Brand.slug == brand_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand with slug '{brand_in.slug}' already exists."
        )

    brand = Brand(**brand_in.model_dump())
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return {
        **brand.__dict__,
        "website_count": 0,
        "keyword_count": 0
    }


@router.get("/{brand_id}", response_model=BrandOut)
def get_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    w_count = db.query(Website).filter(Website.brand_id == brand.id).count()
    kw_count = db.query(Keyword).join(Website).filter(Website.brand_id == brand.id).count()
    return {
        **brand.__dict__,
        "website_count": w_count,
        "keyword_count": kw_count
    }


@router.put("/{brand_id}", response_model=BrandOut)
def update_brand(
    brand_id: int,
    brand_in: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    update_data = brand_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(brand, field, val)

    db.commit()
    db.refresh(brand)
    
    w_count = db.query(Website).filter(Website.brand_id == brand.id).count()
    kw_count = db.query(Keyword).join(Website).filter(Website.brand_id == brand.id).count()
    return {
        **brand.__dict__,
        "website_count": w_count,
        "keyword_count": kw_count
    }


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    db.delete(brand)
    db.commit()
    return None
