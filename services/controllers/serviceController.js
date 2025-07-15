const { v4: uuidv4 } = require('uuid');
const { Services, ServiceDocuments, ServiceFees } = require('../models');

const addService = async (req, res, next) => {
  const {
    nameEn,
    nameAr,
    serviceCode,
    DepartmentEn,
    DepartmentAr,
    SectorEn,
    SectorAr,
    DescriptionEn,
    DescriptionAr,
    ServiceFees: serviceFeeValue,
    ServiceChannelApply,
    ServiceChannelDeliver,
    ServiceChannelPay,
    createdBy,
    documents,
    fees,
  } = req.body;

  const t = await Services.sequelize.transaction();

  try {
    const serviceDguid = uuidv4();

    const newService = await Services.create(
      {
        dguid: serviceDguid,
        nameEn,
        nameAr,
        serviceCode,
        DepartmentEn,
        DepartmentAr,
        SectorEn,
        SectorAr,
        DescriptionEn,
        DescriptionAr,
        ServiceFees: serviceFeeValue,
        ServiceChannelApply,
        ServiceChannelDeliver,
        ServiceChannelPay,
        createdBy,
      },
      { transaction: t }
    );

    const serviceId = newService.id;

    if (Array.isArray(documents)) {
      for (const doc of documents) {
        await ServiceDocuments.create(
          {
            dguid: uuidv4(),
            serviceId,
            documentNameEn: doc.documentNameEn,
            documentNameAr: doc.documentNameAr,
            createdBy,
          },
          { transaction: t }
        );
      }
    }

    if (Array.isArray(fees)) {
      for (const fee of fees) {
        await ServiceFees.create(
          {
            dguid: uuidv4(),
            serviceId,
            titleEn: fee.titleEn,
            titleAr: fee.titleAr,
            descriptionEn: fee.descriptionEn,
            descriptionAr: fee.descriptionAr,
            createdBy,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    return res.status(201).json({
      success: true,
      message: "Service added successfully",
      serviceId,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateService = async (req, res) => {
  const { serviceId } = req.params;
  const {
    nameEn,
    nameAr,
    serviceCode,
    DepartmentEn,
    DepartmentAr,
    SectorEn,
    SectorAr,
    DescriptionEn,
    DescriptionAr,
    ServiceFees: serviceFeeValue,
    ServiceChannelApply,
    ServiceChannelDeliver,
    ServiceChannelPay,
    updatedBy,
    documents,
    fees,
  } = req.body;

  const t = await Services.sequelize.transaction();

  try {
    const service = await Services.findByPk(serviceId);
    if (!service) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    await service.update(
      {
        nameEn,
        nameAr,
        serviceCode,
        DepartmentEn,
        DepartmentAr,
        SectorEn,
        SectorAr,
        DescriptionEn,
        DescriptionAr,
        ServiceFees: serviceFeeValue,
        ServiceChannelApply,
        ServiceChannelDeliver,
        ServiceChannelPay,
        updatedBy,
        updatedAt: new Date(),
      },
      { transaction: t }
    );

    if (Array.isArray(documents)) {
      await ServiceDocuments.destroy({ where: { serviceId: serviceId }, transaction: t });

      for (const doc of documents) {
        await ServiceDocuments.create(
          {
            dguid: uuidv4(),
            serviceId: serviceId,
            documentNameEn: doc.documentNameEn,
            documentNameAr: doc.documentNameAr,
            createdBy: updatedBy,
          },
          { transaction: t }
        );
      }
    }

    if (Array.isArray(fees)) {
      await ServiceFees.destroy({ where: { serviceId: serviceId }, transaction: t });

      for (const fee of fees) {
        await ServiceFees.create(
          {
            dguid: uuidv4(),
            serviceId: serviceId,
            titleEn: fee.titleEn,
            titleAr: fee.titleAr,
            descriptionEn: fee.descriptionEn,
            descriptionAr: fee.descriptionAr,
            createdBy: updatedBy,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getService = async (req, res) => {
  const { serviceId } = req.params;
  try {
    const service = await Services.findByPk(serviceId, {
      include: [
        {
          model: ServiceDocuments,
          as: 'documents',
          where: { serviceId },
          required: false,
        },
        {
          model: ServiceFees,
          as: 'fees',
          where: { serviceId },
          required: false,
        },
      ],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Get Service Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  addService,
  updateService,
  getService
};
