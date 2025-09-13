import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard,
  Download,
  AlertTriangle,
  Shield,
  DollarSign,
  Calendar,
  X,
  Check,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestoreService';
import { GovernorService } from '../../services/governorService';
import { AccountCreationRequest } from '../../types/user';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const AccountCreationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccountCreationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AccountCreationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalConditions, setApprovalConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await FirestoreService.getAccountCreationRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load account creation requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request: AccountCreationRequest) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
    setRejectionReason('');
    setApprovalConditions([]);
    setNewCondition('');
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;

    setIsProcessing(true);
    setError('');

    try {
      await GovernorService.approveAccountCreation(
        selectedRequest.id,
        user.id,
        user.name,
        approvalConditions.length > 0 ? approvalConditions : undefined
      );
      
      await loadRequests();
      setShowReviewModal(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve account creation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await FirestoreService.updateDocument('accountCreationRequests', selectedRequest.id, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        reviewedBy: user?.name,
        reviewedAt: new Date()
      });
      
      await loadRequests();
      setShowReviewModal(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject account creation');
    } finally {
      setIsProcessing(false);
    }
  };

  const addCondition = () => {
    if (newCondition.trim() && !approvalConditions.includes(newCondition.trim())) {
      setApprovalConditions([...approvalConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setApprovalConditions(approvalConditions.filter((_, i) => i !== index));
  };

  const handleImageClick = (src: string, title: string) => {
    setSelectedImage({ src, title });
    setShowImageModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              ACCOUNT CREATION REQUESTS
            </h1>
            <p className="text-gray-600 mt-1 uppercase tracking-wide">
              Review and approve new investor applications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {processedRequests.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {processedRequests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} />
            <span className="font-medium uppercase tracking-wide">{error}</span>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center">
              <Clock size={20} className="mr-2 text-yellow-600" />
              PENDING REQUESTS ({pendingRequests.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                        {request.applicantName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Email:</span>
                        <p className="font-medium text-gray-900">{request.applicantEmail}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Country:</span>
                        <p className="font-medium text-gray-900">{request.applicantCountry}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Initial Deposit:</span>
                        <p className="font-medium text-gray-900">${request.initialDeposit?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Requested:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                      className="flex items-center space-x-2 uppercase tracking-wide"
                    >
                      <Eye size={16} />
                      <span>REVIEW</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center">
              <CheckCircle size={20} className="mr-2 text-green-600" />
              PROCESSED REQUESTS ({processedRequests.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {processedRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                        {request.applicantName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Email:</span>
                        <p className="font-medium text-gray-900">{request.applicantEmail}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Country:</span>
                        <p className="font-medium text-gray-900">{request.applicantCountry}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Initial Deposit:</span>
                        <p className="font-medium text-gray-900">${request.initialDeposit?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Reviewed By:</span>
                        <p className="font-medium text-gray-900">{request.reviewedBy || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Reviewed:</span>
                        <p className="font-medium text-gray-900">
                          {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {request.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <span className="text-red-700 text-sm font-medium uppercase tracking-wide">
                          Rejection Reason: {request.rejectionReason}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                      className="flex items-center space-x-2 uppercase tracking-wide"
                    >
                      <Eye size={16} />
                      <span>VIEW</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 uppercase tracking-wide">
            NO ACCOUNT CREATION REQUESTS
          </h3>
          <p className="text-gray-500 uppercase tracking-wide">
            New investor applications will appear here for review
          </p>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title={`REVIEW APPLICATION - ${selectedRequest.applicantName.toUpperCase()}`}
          size="xl"
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Personal Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                <User size={20} className="mr-2" />
                PERSONAL INFORMATION
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                  <p className="font-bold text-gray-900">{selectedRequest.applicantName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="font-bold text-gray-900">{selectedRequest.applicantEmail}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="font-bold text-gray-900">{selectedRequest.applicantPhone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</label>
                  <p className="font-bold text-gray-900">{selectedRequest.applicantCountry}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                  <p className="font-bold text-gray-900">{selectedRequest.applicantCity}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Type</label>
                  <p className="font-bold text-gray-900">{selectedRequest.accountType}</p>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                <DollarSign size={20} className="mr-2" />
                FINANCIAL INFORMATION
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Initial Deposit</label>
                  <p className="font-bold text-gray-900 text-xl">${selectedRequest.initialDeposit?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</label>
                  <p className="font-bold text-gray-900">{selectedRequest.bankDetails?.currency || 'USD'}</p>
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                <Building size={20} className="mr-2" />
                BANKING INFORMATION
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedRequest.bankDetails || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <p className="font-bold text-gray-900">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                <Shield size={20} className="mr-2" />
                UPLOADED DOCUMENTS
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Identity Document */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                    Identity Document ({selectedRequest.identityDocument?.type?.replace('_', ' ').toUpperCase()})
                  </label>
                  {selectedRequest.identityDocument?.base64Data ? (
                    <div className="space-y-2">
                      {selectedRequest.identityDocument.fileType.startsWith('image/') ? (
                        <img
                          src={selectedRequest.identityDocument.base64Data}
                          alt="Identity Document"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(
                            selectedRequest.identityDocument.base64Data,
                            `Identity Document - ${selectedRequest.applicantName}`
                          )}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 font-medium uppercase tracking-wide">
                              {selectedRequest.identityDocument.fileName}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Size: {(selectedRequest.identityDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 uppercase tracking-wide">No document uploaded</p>
                  )}
                </div>

                {/* Proof of Deposit */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                    Proof of Deposit
                  </label>
                  {selectedRequest.proofOfDeposit?.base64Data ? (
                    <div className="space-y-2">
                      {selectedRequest.proofOfDeposit.fileType.startsWith('image/') ? (
                        <img
                          src={selectedRequest.proofOfDeposit.base64Data}
                          alt="Proof of Deposit"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(
                            selectedRequest.proofOfDeposit.base64Data,
                            `Proof of Deposit - ${selectedRequest.applicantName}`
                          )}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 font-medium uppercase tracking-wide">
                              {selectedRequest.proofOfDeposit.fileName}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Size: {(selectedRequest.proofOfDeposit.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 uppercase tracking-wide">No document uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Request Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                <Calendar size={20} className="mr-2" />
                REQUEST INFORMATION
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested By</label>
                  <p className="font-bold text-gray-900">{selectedRequest.requestedByName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested At</label>
                  <p className="font-bold text-gray-900">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agreement Accepted</label>
                  <p className="font-bold text-gray-900">
                    {selectedRequest.agreementAccepted ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agreement Accepted At</label>
                  <p className="font-bold text-gray-900">
                    {new Date(selectedRequest.agreementAcceptedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions for Pending Requests */}
            {selectedRequest.status === 'pending' && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  REVIEW ACTIONS
                </h3>
                
                {/* Approval Conditions */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    APPROVAL CONDITIONS (OPTIONAL)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Add a condition..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                      onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                    />
                    <Button
                      variant="outline"
                      onClick={addCondition}
                      disabled={!newCondition.trim()}
                      className="uppercase tracking-wide"
                    >
                      ADD
                    </Button>
                  </div>
                  {approvalConditions.length > 0 && (
                    <div className="space-y-2">
                      {approvalConditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-900">{condition}</span>
                          <button
                            onClick={() => removeCondition(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    REJECTION REASON (IF REJECTING)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} />
                      <span className="font-medium uppercase tracking-wide">{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 uppercase tracking-wide"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <XCircle size={16} />
                    )}
                    <span>REJECT</span>
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white uppercase tracking-wide"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    <span>APPROVE</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Status for Processed Requests */}
            {selectedRequest.status !== 'pending' && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  REVIEW STATUS
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <p className={`font-bold text-lg ${
                      selectedRequest.status === 'approved' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedRequest.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reviewed By</label>
                    <p className="font-bold text-gray-900">{selectedRequest.reviewedBy}</p>
                  </div>
                </div>
                {selectedRequest.rejectionReason && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejection Reason</label>
                    <p className="font-medium text-red-600">{selectedRequest.rejectionReason}</p>
                  </div>
                )}
                {selectedRequest.approvalConditions && selectedRequest.approvalConditions.length > 0 && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approval Conditions</label>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {selectedRequest.approvalConditions.map((condition, index) => (
                        <li key={index} className="text-gray-900">{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <Modal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          title={selectedImage.title}
          size="xl"
        >
          <div className="text-center">
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-w-full max-h-[70vh] mx-auto rounded-lg border border-gray-200"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountCreationRequests;