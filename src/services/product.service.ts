import Product, { IProduct } from '../models/product.model'

export class ProductService {
  /**
   * Get all products with pagination
   */
  static async getAllProducts(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(),
    ])

    return { products, total }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string) {
    const product = await Product.findById(id).lean()
    return product
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: {
    name: string
    category?: string
    unit?: IProduct['unit']
    purchasePrice: number
    sellingPrice?: number
    stock?: number
    notes?: string
  }) {
    if (!productData.name || productData.purchasePrice === undefined) {
      throw new Error('حقل name وحقل purchasePrice مطلوبان.')
    }

    const newProduct = new Product({
      name: productData.name.trim(),
      category: productData.category ? productData.category.trim() : undefined,
      unit: productData.unit || 'قطعة',
      purchasePrice: Number(productData.purchasePrice),
      sellingPrice:
        productData.sellingPrice !== undefined
          ? Number(productData.sellingPrice)
          : undefined,
      stock: productData.stock !== undefined ? Number(productData.stock) : 0,
      notes: productData.notes ? productData.notes : undefined,
    })

    const saved = await newProduct.save()
    return saved
  }

  /**
   * Update product by ID
   */
  static async updateProduct(
    id: string,
    updateData: {
      name?: string
      category?: string
      unit?: IProduct['unit']
      purchasePrice?: number
      sellingPrice?: number
      stock?: number
      notes?: string
    }
  ) {
    const product = await Product.findById(id)
    if (!product) {
      throw new Error('المنتج غير موجود.')
    }

    if (updateData.name !== undefined) product.name = updateData.name.trim()
    if (updateData.category !== undefined)
      product.category = updateData.category.trim()
    if (updateData.unit !== undefined) product.unit = updateData.unit
    if (updateData.purchasePrice !== undefined)
      product.purchasePrice = Number(updateData.purchasePrice)
    if (updateData.sellingPrice !== undefined)
      product.sellingPrice = Number(updateData.sellingPrice)
    if (updateData.stock !== undefined) product.stock = Number(updateData.stock)
    if (updateData.notes !== undefined) product.notes = updateData.notes

    const updated = await product.save()
    return updated.toObject()
  }

  /**
   * Delete product by ID
   */
  static async deleteProduct(id: string) {
    const product = await Product.findById(id)
    if (!product) {
      throw new Error('المنتج غير موجود.')
    }

    await Product.findByIdAndDelete(id)
    return true
  }
}

