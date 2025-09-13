import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign,
  Building,
  CreditCard,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  X,
  Shield,
  Calendar,
  Globe,
  Lock,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

interface InvestorOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedDocument {
  type: 'id_card' | 'passport' | 'proof_of_deposit';
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string; // Changed from base64Data
  uploadedAt: Date;
}

// Enhanced bank data for the 5 specified countries
const banksByCountry: Record<string, string[]> = {
  'Mexico': [
    'Santander México', 'Banorte', 'BBVA México', 'Banamex (Citibanamex)', 'HSBC México',
    'Scotiabank México', 'Banco Azteca', 'Inbursa', 'Banco del Bajío', 'Banregio'
  ],
  'France': [
    'BNP Paribas', 'Crédit Agricole', 'Société Générale', 'Crédit Mutuel', 'BPCE (Banque Populaire)',
    'La Banque Postale', 'Crédit du Nord', 'HSBC France', 'ING Direct France', 'Boursorama Banque'
  ],
  'Switzerland': [
    'UBS', 'Credit Suisse', 'Julius Baer', 'Pictet', 'Lombard Odier',
    'Banque Cantonale Vaudois', 'Zürcher Kantonalbank', 'PostFinance', 'Raiffeisen Switzerland', 'Migros Bank'
  ],
  'Saudi Arabia': [
    'Saudi National Bank (SNB)', 'Al Rajhi Bank', 'Riyad Bank', 'Banque Saudi Fransi', 'Saudi British Bank (SABB)',
    'Arab National Bank', 'Bank AlJazira', 'Alinma Bank', 'Bank Albilad', 'Saudi Investment Bank'
  ],
  'United Arab Emirates': [
    'Emirates NBD', 'First Abu Dhabi Bank (FAB)', 'Abu Dhabi Commercial Bank (ADCB)', 'Dubai Islamic Bank', 'Mashreq Bank',
    'Commercial Bank of Dubai', 'Union National Bank', 'Ajman Bank', 'Bank of Sharjah', 'Fujairah National Bank'
  ]
};

// Bank form fields for each country
const bankFormFields: Record<string, any> = {
  'Mexico': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'clabe', label: 'CLABE (18 digits)', type: 'text', required: true, maxLength: 18 },
      { name: 'bankBranch', label: 'Bank Branch', type: 'text', required: false },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'MXN'
  },
  'France': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 34 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'EUR'
  },
  'Switzerland': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 21 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'CHF'
  },
  'Saudi Arabia': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 24 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'SAR'
  },
  'United Arab Emirates': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 23 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'emiratesId', label: 'Emirates ID', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'AED'
  }
};

const InvestorOnboardingFlow = ({ isOpen, onClose, onSuccess }: InvestorOnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form data state
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Mexico',
    city: ''
  });

  const [financialData, setFinancialData] = useState({
    initialDeposit: '',
    accountType: 'Standard' as 'Standard' | 'Pro'
  });

  const [bankData, setBankData] = useState({
    selectedBank: '',
    formData: {} as Record<string, string>
  });

  const [verificationData, setVerificationData] = useState({
    idType: 'id_card' as 'id_card' | 'passport',
    depositMethod: 'bank_transfer' as 'bank_transfer' | 'crypto' | 'credit_card',
    selectedCrypto: 'BTC' as 'BTC' | 'ETH' | 'USDT'
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // File input refs
  const identityFileRef = useRef<HTMLInputElement>(null);
  const depositFileRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, title: 'Personal Information', icon: <User size={20} /> },
    { id: 2, title: 'Financial Details', icon: <DollarSign size={20} /> },
    { id: 3, title: 'Banking Information', icon: <Building size={20} /> },
    { id: 4, title: 'Identity Verification', icon: <Shield size={20} /> },
    { id: 5, title: 'Agreement & Submission', icon: <FileText size={20} /> }
  ];

  // Get available banks and form fields for selected country
  const availableBanks = banksByCountry[personalData.country] || [];
  const countryBankFields = bankFormFields[personalData.country];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    documentType: 'identity' | 'proof_of_deposit'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload only JPG, PNG, or PDF files');
      return;
    }

    try {
      // Convert file to Base64 (Data URL)
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('📄 File converted to Data URL:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        urlLength: fileUrl.length, // Log the length of the Data URL
        documentType
      });

      const documentData: UploadedDocument = {
        type: documentType === 'identity' ? verificationData.idType : 'proof_of_deposit',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: fileUrl, // Store the Data URL in the 'url' field
        uploadedAt: new Date()
      };

      // Remove existing document of same type and add new one
      setUploadedDocuments(prev => {
        const filtered = prev.filter(doc => {
          if (documentType === 'identity') {
            return doc.type !== 'id_card' && doc.type !== 'passport';
          } else {
            return doc.type !== 'proof_of_deposit';
          }
        });
        return [...filtered, documentData];
      });

      setError('');
      console.log('✅ Document uploaded successfully:', documentData.fileName);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    }
  };

  const removeDocument = (documentType: 'identity' | 'proof_of_deposit') => {
    setUploadedDocuments(prev => {
      if (documentType === 'identity') {
        return prev.filter(doc => doc.type !== 'id_card' && doc.type !== 'passport');
      } else {
        return prev.filter(doc => doc.type !== 'proof_of_deposit');
      }
    });
  };

  const getUploadedDocument = (documentType: 'identity' | 'proof_of_deposit') => {
    if (documentType === 'identity') {
      return uploadedDocuments.find(doc => doc.type === 'id_card' || doc.type === 'passport');
    } else {
      return uploadedDocuments.find(doc => doc.type === 'proof_of_deposit');
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(personalData.name && personalData.email && personalData.country && personalData.city);
      case 2:
        const deposit = parseFloat(financialData.initialDeposit);
        return !!(financialData.initialDeposit && !isNaN(deposit) && deposit >= 1000);
      case 3:
        if (!bankData.selectedBank) return false;
        if (!countryBankFields) return true;
        return countryBankFields.fields.every((field: any) => 
          !field.required || bankData.formData[field.name]?.trim()
        );
      case 4:
        const identityDoc = getUploadedDocument('identity');
        const depositDoc = getUploadedDocument('proof_of_deposit');
        return !!(identityDoc && depositDoc);
      case 5:
        return agreementAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setError('');
    } else {
      setError('Please complete all required fields before continuing');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!user || !validateStep(5)) {
      setError('Please complete all steps before submitting');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Submitting account creation request...');

      // Get uploaded documents
      const identityDoc = getUploadedDocument('identity');
      const depositDoc = getUploadedDocument('proof_of_deposit');

      if (!identityDoc || !depositDoc) {
        throw new Error('Required documents not found');
      }

      console.log('📄 Documents found:', {
        identity: {
          fileName: identityDoc.fileName,
          fileType: identityDoc.fileType,
          fileSize: identityDoc.fileSize,
          url: identityDoc.url // Use 'url' field
        },
        deposit: {
          fileName: depositDoc.fileName,
          fileType: depositDoc.fileType,
          fileSize: depositDoc.fileSize,
          url: depositDoc.url // Use 'url' field
        }
      });

      // Prepare bank details
      const bankDetails = {
        bankName: bankData.selectedBank,
        accountHolderName: bankData.formData.accountHolderName || personalData.name,
        ...bankData.formData,
        currency: countryBankFields?.currency || 'USD',
        country: personalData.country
      };

      // Create account creation request
      const requestData = {
        applicantName: personalData.name,
        applicantEmail: personalData.email,
        applicantPhone: personalData.phone,
        applicantCountry: personalData.country,
        applicantCity: personalData.city,
        requestedBy: user.id,
        requestedByName: user.name,
        status: 'pending' as const,
        initialDeposit: parseFloat(financialData.initialDeposit),
        accountType: financialData.accountType,
        bankDetails,
        identityDocument: identityDoc,
        proofOfDeposit: depositDoc,
        agreementAccepted: true,
        agreementAcceptedAt: new Date()
      };

      console.log('📋 Account creation request data prepared:', {
        applicantName: requestData.applicantName,
        applicantCountry: requestData.applicantCountry,
        initialDeposit: requestData.initialDeposit,
        bankName: requestData.bankDetails.bankName,
        hasIdentityDoc: !!requestData.identityDocument,
        hasDepositDoc: !!requestData.proofOfDeposit,
        identityDocSize: requestData.identityDocument.fileSize,
        depositDocSize: requestData.proofOfDeposit.fileSize
      });

      // Submit to Firebase
      const requestId = await FirestoreService.addAccountCreationRequest(requestData);
      
      console.log('✅ Account creation request submitted:', requestId);
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error submitting account creation request:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setPersonalData({ name: '', email: '', phone: '', country: 'Mexico', city: '' });
    setFinancialData({ initialDeposit: '', accountType: 'Standard' });
    setBankData({ selectedBank: '', formData: {} });
    setVerificationData({ idType: 'id_card', depositMethod: 'bank_transfer', selectedCrypto: 'BTC' });
    setUploadedDocuments([]);
    setAgreementAccepted(false);
    setError('');
    setIsSuccess(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                PERSONAL INFORMATION
              </h3>
              <p className="text-gray-600 uppercase tracking-wide text-sm">
                Please provide your personal details for account creation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <User size={16} className="inline mr-1" />
                  FULL NAME *
                </label>
                <input
                  type="text"
                  value={personalData.name}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter your full legal name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <Mail size={16} className="inline mr-1" />
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  value={personalData.email}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <Phone size={16} className="inline mr-1" />
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  value={personalData.phone}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <MapPin size={16} className="inline mr-1" />
                  COUNTRY *
                </label>
                <select
                  value={personalData.country}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  required
                >
                  {Object.keys(banksByCountry).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  CITY *
                </label>
                <input
                  type="text"
                  value={personalData.city}
                  onChange={(e) => setPersonalData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter your city"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                FINANCIAL DETAILS
              </h3>
              <p className="text-gray-600 uppercase tracking-wide text-sm">
                Set your initial investment amount and account preferences
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <DollarSign size={16} className="inline mr-1" />
                  INITIAL DEPOSIT (USD) *
                </label>
                <input
                  type="number"
                  value={financialData.initialDeposit}
                  onChange={(e) => setFinancialData(prev => ({ ...prev, initialDeposit: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium text-lg"
                  placeholder="Minimum $1,000"
                  min="1000"
                  step="100"
                  required
                />
                <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                  Minimum initial deposit: $1,000 USD
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  ACCOUNT TYPE
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFinancialData(prev => ({ ...prev, accountType: 'Standard' }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      financialData.accountType === 'Standard'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">STANDARD</h4>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      Standard trading features and support
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialData(prev => ({ ...prev, accountType: 'Pro' }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      financialData.accountType === 'Pro'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">PRO</h4>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      Advanced features and priority support
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                BANKING INFORMATION
              </h3>
              <p className="text-gray-600 uppercase tracking-wide text-sm">
                Provide your bank details for withdrawals in {personalData.country}
              </p>
            </div>

            {availableBanks.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    SELECT YOUR BANK *
                  </label>
                  <select
                    value={bankData.selectedBank}
                    onChange={(e) => setBankData(prev => ({ ...prev, selectedBank: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    required
                  >
                    <option value="">Choose your bank...</option>
                    {availableBanks.map((bank, index) => (
                      <option key={index} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                {bankData.selectedBank && countryBankFields && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">
                      BANK ACCOUNT DETAILS FOR {bankData.selectedBank}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {countryBankFields.fields.map((field: any) => (
                        <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={field.type}
                            value={bankData.formData[field.name] || (field.name === 'accountHolderName' ? personalData.name : '')}
                            onChange={(e) => setBankData(prev => ({
                              ...prev,
                              formData: { ...prev.formData, [field.name]: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                            placeholder={field.label}
                            maxLength={field.maxLength}
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-white rounded border border-gray-300">
                      <p className="text-gray-800 text-sm font-medium uppercase tracking-wide">
                        <strong>Currency:</strong> Withdrawals will be converted to {countryBankFields.currency} at current exchange rates.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-semibold uppercase tracking-wide">
                      BANKING NOT AVAILABLE
                    </h4>
                    <p className="text-red-700 text-sm mt-1 uppercase tracking-wide">
                      Banking integration is not available for {personalData.country}. 
                      Please contact support for alternative setup options.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                IDENTITY VERIFICATION
              </h3>
              <p className="text-gray-600 uppercase tracking-wide text-sm">
                Upload required documents for account verification
              </p>
            </div>

            <div className="space-y-6">
              {/* Identity Document Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                  IDENTITY DOCUMENT TYPE *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setVerificationData(prev => ({ ...prev, idType: 'id_card' }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      verificationData.idType === 'id_card'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Shield size={24} className="mx-auto mb-2 text-gray-600" />
                    <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">ID CARD</h4>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">National ID or Driver's License</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationData(prev => ({ ...prev, idType: 'passport' }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      verificationData.idType === 'passport'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Globe size={24} className="mx-auto mb-2 text-gray-600" />
                    <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">PASSPORT</h4>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">International Passport</p>
                  </button>
                </div>
              </div>

              {/* Identity Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                  UPLOAD {verificationData.idType === 'id_card' ? 'ID CARD' : 'PASSPORT'} *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {getUploadedDocument('identity') ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded border">
                        <div className="flex items-center space-x-3">
                          {getUploadedDocument('identity')?.fileType.startsWith('image/') ? (
                            <div className="w-16 h-16 bg-gray-200 rounded border overflow-hidden">
                              <img 
                                src={getUploadedDocument('identity')?.url} // Use 'url' field
                                alt="Identity Document"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <FileText size={32} className="text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{getUploadedDocument('identity')?.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {(getUploadedDocument('identity')?.fileSize! / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getUploadedDocument('identity')?.fileType.startsWith('image/') && (
                            <button
                              onClick={() => {
                                const doc = getUploadedDocument('identity');
                                if (doc) {
                                  // Create image preview modal
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
                                  modal.onclick = () => document.body.removeChild(modal);
                                  
                                  modal.innerHTML = `
                                    <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onclick="event.stopPropagation()">
                                      <div class="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
                                        <h3 class="text-lg font-semibold text-gray-900">${doc.fileName}</h3>
                                        <button onclick="document.body.removeChild(this.closest('.fixed'))" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                          <span class="text-gray-500 text-lg">×</span>
                                        </button>
                                      </div>
                                      <div class="p-6 max-h-[80vh] overflow-auto">
                                        <img src="${doc.url}" alt="${doc.fileName}" class="w-full h-auto max-w-full" style="max-height: 70vh" />
                                      </div>
                                    </div>
                                  `;
                                  
                                  document.body.appendChild(modal);
                                }
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Preview image"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => removeDocument('identity')}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title="Remove document"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input
                        ref={identityFileRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'identity')}
                        className="hidden"
                      />
                      <Camera size={48} className="mx-auto text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2 uppercase tracking-wide">
                        UPLOAD {verificationData.idType === 'id_card' ? 'ID CARD' : 'PASSPORT'}
                      </h4>
                      <p className="text-gray-600 mb-4 uppercase tracking-wide text-sm">
                        Take a clear photo or upload a scan of your {verificationData.idType === 'id_card' ? 'ID card' : 'passport'}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => identityFileRef.current?.click()}
                        className="uppercase tracking-wide"
                      >
                        <Upload size={16} className="mr-2" />
                        CHOOSE FILE
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">
                        Supported formats: JPG, PNG, PDF (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              
              </div>

              {/* Proof of Deposit Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                  UPLOAD PROOF OF DEPOSIT *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {getUploadedDocument('proof_of_deposit') ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded border">
                        <div className="flex items-center space-x-3">
                          {getUploadedDocument('proof_of_deposit')?.fileType.startsWith('image/') ? (
                            <div className="w-16 h-16 bg-gray-200 rounded border overflow-hidden">
                              <img 
                                src={getUploadedDocument('proof_of_deposit')?.url} // Use 'url' field
                                alt="Proof of Deposit"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <FileText size={32} className="text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{getUploadedDocument('proof_of_deposit')?.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {(getUploadedDocument('proof_of_deposit')?.fileSize! / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getUploadedDocument('proof_of_deposit')?.fileType.startsWith('image/') && (
                            <button
                              onClick={() => {
                                const doc = getUploadedDocument('proof_of_deposit');
                                if (doc) {
                                  // Create image preview modal
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4';
                                  modal.onclick = () => document.body.removeChild(modal);
                                  
                                  modal.innerHTML = `
                                    <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onclick="event.stopPropagation()">
                                      <div class="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
                                        <h3 class="text-lg font-semibold text-gray-900">${doc.fileName}</h3>
                                        <button onclick="document.body.removeChild(this.closest('.fixed'))" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                          <span class="text-gray-500 text-lg">×</span>
                                        </button>
                                      </div>
                                      <div class="p-6 max-h-[80vh] overflow-auto">
                                        <img src="${doc.url}" alt="${doc.fileName}" class="w-full h-auto max-w-full" style="max-height: 70vh" />
                                      </div>
                                    </div>
                                  `;
                                  
                                  document.body.appendChild(modal);
                                }
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Preview image"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => removeDocument('proof_of_deposit')}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title="Remove document"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input
                        ref={depositFileRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'proof_of_deposit')}
                        className="hidden"
                      />
                      <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2 uppercase tracking-wide">
                        UPLOAD PROOF OF DEPOSIT
                      </h4>
                      <p className="text-gray-600 mb-4 uppercase tracking-wide text-sm">
                        Upload a bank statement or screenshot showing your initial deposit
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => depositFileRef.current?.click()}
                        className="uppercase tracking-wide"
                      >
                        <Upload size={16} className="mr-2" />
                        CHOOSE FILE
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">
                        Supported formats: JPG, PNG, PDF (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                AGREEMENT & SUBMISSION
              </h3>
              <p className="text-gray-600 uppercase tracking-wide text-sm">
                Review and accept the terms before submitting your application
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
              <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">
                APPLICATION SUMMARY
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                  <p className="font-bold text-gray-900">{personalData.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="font-bold text-gray-900">{personalData.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</label>
                  <p className="font-bold text-gray-900">{personalData.country}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Initial Deposit</label>
                  <p className="font-bold text-gray-900">${parseFloat(financialData.initialDeposit).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Type</label>
                  <p className="font-bold text-gray-900">{financialData.accountType}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected Bank</label>
                  <p className="font-bold text-gray-900">{bankData.selectedBank}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Identity Document</label>
                  <p className="font-bold text-gray-900">{getUploadedDocument('identity')?.fileName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proof of Deposit</label>
                  <p className="font-bold text-gray-900">{getUploadedDocument('proof_of_deposit')?.fileName || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">
                TERMS AND CONDITIONS
              </h4>
              <div className="max-h-48 overflow-y-auto text-sm text-gray-700 border border-gray-300 p-4 rounded-lg">
                <p className="mb-2">
                  By submitting this application, I confirm that all information provided is true and accurate to the best of my knowledge. I understand that false information may lead to the rejection of my application or termination of my account.
                </p>
                <p className="mb-2">
                  I agree to the Interactive Brokers LLC Client Agreement, Privacy Policy, and all other terms and conditions governing my account. I understand that trading involves substantial risk of loss and is not suitable for all investors.
                </p>
                <p className="mb-2">
                  I authorize Interactive Brokers LLC to conduct any necessary background checks, identity verification, and financial assessments as required by law and internal policies.
                </p>
                <p className="mb-2">
                  I acknowledge that my account will be subject to a 15% commission on all withdrawals, and that withdrawals may take 1-3 business days to process, or longer if additional verification is required.
                </p>
                <p className="mb-2">
                  I understand that my account will be reviewed by a Governor for final approval, and that this process may take up to 7 business days.
                </p>
              </div>
              <label className="flex items-center mt-4">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-2 text-sm font-medium text-gray-900 uppercase tracking-wide">
                  I have read and agree to the terms and conditions *
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="INVESTOR ONBOARDING FLOW"
      size="xl"
    >
      {!isSuccess ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-6">
            {steps.map(step => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= step.id
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step.icon}
                </div>
                <p className={`text-xs mt-2 text-center uppercase tracking-wide ${
                  currentStep >= step.id ? 'font-bold text-gray-900' : 'text-gray-600'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            {renderStepContent()}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} />
                <span className="font-medium uppercase tracking-wide">{error}</span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isLoading}
              className="uppercase tracking-wide"
            >
              PREVIOUS
            </Button>
            {currentStep < steps.length ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isLoading || !validateStep(currentStep)}
                className="uppercase tracking-wide"
              >
                NEXT
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading || !validateStep(currentStep)}
                className="uppercase tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    SUBMITTING...
                  </div>
                ) : (
                  'SUBMIT APPLICATION'
                )}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            APPLICATION SUBMITTED SUCCESSFULLY
          </h3>
          <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
            Your account creation request has been submitted for Governor review.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-800 text-sm font-medium uppercase tracking-wide">
              <strong>NEXT STEPS:</strong> OUR GOVERNOR TEAM WILL REVIEW YOUR APPLICATION AND UPLOADED DOCUMENTS. 
              YOU WILL RECEIVE A NOTIFICATION ONCE YOUR ACCOUNT IS APPROVED OR IF ADDITIONAL INFORMATION IS REQUIRED.
            </p>
          </div>
          <Button
            onClick={handleClose}
            className="mt-6 uppercase tracking-wide"
          >
            CLOSE
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default InvestorOnboardingFlow;
